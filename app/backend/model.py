"""The classifier: building it, loading the trained checkpoint, and one prediction with Grad-CAM.

Checkpoint format. The notebooks save the app's model as app/models/model.pt like this:

    torch.save({
        "arch": "mobilenet_v2",              # or "resnet50", "vgg16", "custom_cnn"
        "classes": classes,                  # data/classes.json as loaded, or its folder names in label order
        "state_dict": model.state_dict(),
        "img_size": 224,                     # optional, default 224
        "mean": [0.485, 0.456, 0.406],       # optional, ImageNet default
        "std": [0.229, 0.224, 0.225],        # optional, ImageNet default
        "name": "MobileNetV2 (real + GAN)",  # optional, shown on the About page
        "metrics": {"test_accuracy": 0.99},  # optional, shown on the About page
        "confidence_threshold": 0.85,        # optional: below it the app says "Not sure" (notebook 05 sets it)
        "training_images": "Real + GAN",     # optional, shown on the About page
    }, "model.pt")

A bare `model.state_dict()` saved on its own also loads: the architecture is recognised from the weight names, and
the 10 PlantVillage tomato classes in sorted order are assumed.

The classifier head must be replaced the same way as in the builders below, so the weights fit.
"""

from __future__ import annotations

import logging
import threading
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import torch
from PIL import Image
from torch import nn
from torchvision import models

import heatmap

log = logging.getLogger(__name__)

# The 10 PlantVillage tomato folders in sorted order, which is the label order of data/classes.json.
# Used by the placeholder model and by checkpoints that do not list their classes.
DEFAULT_CLASSES = [
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy",
]
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]
DISPLAY_SIZE = 512  # size of the photo and heatmap sent back to the browser
TOP_K = 3


class ModelLoadError(Exception):
    """The model file exists but cannot be used; the message says why, in plain words."""


class CustomCNN(nn.Module):
    """The custom CNN of notebook 02 (the same layers, so its weights load):
    5 blocks of [3x3 conv + batch norm + ReLU] x 2 + 2x2 max pool; then average pool, dropout, linear layer."""

    def __init__(self, num_classes, widths=(32, 64, 128, 256, 512)):
        super().__init__()
        layers, c_in = [], 3
        for c in widths:
            for _ in range(2):
                layers += [nn.Conv2d(c_in, c, 3, padding=1, bias=False), nn.BatchNorm2d(c), nn.ReLU(inplace=True)]
                c_in = c
            layers.append(nn.MaxPool2d(2))
        self.features = nn.Sequential(*layers)
        self.classifier = nn.Sequential(nn.AdaptiveAvgPool2d(1), nn.Flatten(), nn.Dropout(0.2),
                                        nn.Linear(c_in, num_classes))

    def forward(self, x):
        return self.classifier(self.features(x))


def _mobilenet_v2(num_classes: int) -> tuple[nn.Module, nn.Module]:
    net = models.mobilenet_v2(weights=None)
    net.classifier[1] = nn.Linear(net.last_channel, num_classes)
    return net, net.features[-1]


def _resnet50(num_classes: int) -> tuple[nn.Module, nn.Module]:
    net = models.resnet50(weights=None)
    net.fc = nn.Linear(net.fc.in_features, num_classes)
    return net, net.layer4


def _vgg16(num_classes: int) -> tuple[nn.Module, nn.Module]:
    net = models.vgg16(weights=None)
    net.classifier[6] = nn.Linear(net.classifier[6].in_features, num_classes)
    return net, net.features[29]  # the ReLU after the last convolution


def _custom_cnn(num_classes: int) -> tuple[nn.Module, nn.Module]:
    net = CustomCNN(num_classes)
    return net, net.features[-2]  # the ReLU after the last convolution (before the last max pool)


# arch name -> builder that returns (network, the layer Grad-CAM reads)
ARCHS = {"mobilenet_v2": _mobilenet_v2, "resnet50": _resnet50, "vgg16": _vgg16, "custom_cnn": _custom_cnn}
# arch name -> the weight of its last layer (its first dimension is the number of classes)
HEAD_KEYS = {"mobilenet_v2": "classifier.1.weight", "resnet50": "fc.weight", "vgg16": "classifier.6.weight",
             "custom_cnn": "classifier.3.weight"}


@dataclass
class LoadedModel:
    net: nn.Module
    cam_layer: nn.Module
    arch: str
    classes: list[str]
    name: str
    trained: bool
    img_size: int = 224
    mean: list[float] = field(default_factory=lambda: list(IMAGENET_MEAN))
    std: list[float] = field(default_factory=lambda: list(IMAGENET_STD))
    metrics: dict = field(default_factory=dict)
    threshold: float | None = None  # the "not sure" threshold saved with the model, if any
    details: dict = field(default_factory=dict)  # training images, row, seed... (shown on the About page)


def _class_ids(classes: list) -> list[str]:
    """Folder names in label order, from plain names or from the entries of data/classes.json
    ({"label": 0, "folder": "Tomato___Bacterial_spot", "name": "Bacterial spot"})."""
    if classes and isinstance(classes[0], dict):
        return [c["folder"] for c in sorted(classes, key=lambda c: c["label"])]
    return [str(c) for c in classes]


def _infer_arch(state: dict) -> str | None:
    """Which of the four networks a state_dict belongs to, from its weight names."""
    keys = set(state)
    if "fc.weight" in keys and any(k.startswith("layer4.") for k in keys):
        return "resnet50"
    if "classifier.6.weight" in keys:
        return "vgg16"
    if "classifier.1.weight" in keys and "features.18.0.weight" in keys:
        return "mobilenet_v2"
    if "classifier.3.weight" in keys and "features.0.weight" in keys:
        return "custom_cnn"
    return None


def placeholder() -> LoadedModel:
    """An untrained MobileNetV2 (random weights), so the app works before a model is trained."""
    torch.manual_seed(0)
    net, layer = _mobilenet_v2(len(DEFAULT_CLASSES))
    return LoadedModel(net.eval(), layer, "mobilenet_v2", list(DEFAULT_CLASSES),
                       name="Untrained placeholder (MobileNetV2, random weights)", trained=False)


def load_model(path: Path) -> LoadedModel:
    """Load the trained checkpoint, or an untrained placeholder when there is none yet.

    Raises ModelLoadError when the file exists but cannot be used.
    """
    path = Path(path)
    if not path.is_file():
        log.warning("No model at %s: using an untrained placeholder, so the predictions are random.", path)
        return placeholder()

    try:
        ckpt = torch.load(path, map_location="cpu", weights_only=True)
    except Exception as err:
        raise ModelLoadError(
            f"{path.name} could not be read ({type(err).__name__}). Save the model as a checkpoint dict with "
            '"arch", "classes" and "state_dict" (as the notebooks do), not the whole model object.') from err
    if not isinstance(ckpt, dict):
        raise ModelLoadError(f"{path.name} does not hold a checkpoint dict.")

    # A checkpoint dict, or a bare state_dict (only tensors)
    if "state_dict" in ckpt:
        state = ckpt["state_dict"]
    elif ckpt and all(isinstance(v, torch.Tensor) for v in ckpt.values()):
        state, ckpt = ckpt, {}
    else:
        raise ModelLoadError(f'{path.name} has no "state_dict".')
    # Models wrapped by torch.compile or DataParallel save their weights with a prefix.
    state = {k.removeprefix("_orig_mod.").removeprefix("module."): v for k, v in state.items()}

    arch = ckpt.get("arch") or _infer_arch(state)
    if arch not in ARCHS:
        raise ModelLoadError(f"Unknown model type {arch!r} in {path.name}; the app knows {', '.join(sorted(ARCHS))}.")
    head = state.get(HEAD_KEYS[arch])
    if head is None:
        raise ModelLoadError(f"The weights in {path.name} do not belong to a {arch} built as in the notebooks "
                             f"(no {HEAD_KEYS[arch]}).")
    classes = _class_ids(list(ckpt["classes"])) if ckpt.get("classes") else list(DEFAULT_CLASSES)
    if head.shape[0] != len(classes):
        raise ModelLoadError(f"{path.name} has {head.shape[0]} outputs but {len(classes)} classes.")

    net, layer = ARCHS[arch](len(classes))
    try:
        net.load_state_dict(state)
    except RuntimeError as err:
        raise ModelLoadError(f"The weights in {path.name} do not fit a {arch}: was its last layer replaced as in "
                             f"app/backend/model.py? ({str(err).splitlines()[0]})") from err

    threshold = ckpt.get("confidence_threshold")
    details = {k: ckpt[k] for k in ("training_images", "row", "seed", "best_epoch", "threshold_rule") if k in ckpt}
    name = ckpt.get("name", arch)
    log.info("Loaded %s (%s, %d classes) from %s", name, arch, len(classes), path)
    return LoadedModel(
        net.eval(), layer, arch, classes,
        name=name,
        trained=True,
        img_size=int(ckpt.get("img_size", 224)),
        mean=list(ckpt.get("mean", IMAGENET_MEAN)),
        std=list(ckpt.get("std", IMAGENET_STD)),
        metrics=dict(ckpt.get("metrics", {})),
        threshold=float(threshold) if threshold is not None else None,
        details=details,
    )


def is_healthy(class_id: str) -> bool:
    return "healthy" in class_id.lower()


class Predictor:
    """Runs the model on one photo. One request at a time, since the Grad-CAM hook keeps state."""

    def __init__(self, model: LoadedModel, threshold: float):
        self.model = model
        self.threshold = threshold
        self._lock = threading.Lock()
        self._activations: torch.Tensor | None = None
        model.cam_layer.register_forward_hook(self._keep_activations)
        self._mean = torch.tensor(model.mean, dtype=torch.float32).view(3, 1, 1)
        self._std = torch.tensor(model.std, dtype=torch.float32).view(3, 1, 1)

    def _keep_activations(self, module, inputs, output):
        self._activations = output

    def info(self) -> dict:
        m = self.model
        return {
            "name": m.name,
            "arch": m.arch,
            "trained": m.trained,
            "classes": m.classes,
            "img_size": m.img_size,
            "metrics": m.metrics,
            "details": m.details,
            "confidence_threshold": self.threshold,
        }

    def _to_tensor(self, square: Image.Image) -> torch.Tensor:
        size = self.model.img_size
        small = square.resize((size, size), Image.Resampling.BILINEAR)
        x = torch.from_numpy(np.asarray(small, dtype=np.float32) / 255.0).permute(2, 0, 1)
        return ((x - self._mean) / self._std).unsqueeze(0)

    def predict(self, image: Image.Image) -> dict:
        square = heatmap.center_square(image.convert("RGB"))
        display = square.resize((DISPLAY_SIZE, DISPLAY_SIZE), Image.Resampling.LANCZOS) \
            if square.width > DISPLAY_SIZE else square
        x = self._to_tensor(square)

        with self._lock, torch.enable_grad():
            logits = self.model.net(x)
            probs = torch.softmax(logits, dim=1)[0].detach()
            top_p, top_i = probs.topk(min(TOP_K, len(self.model.classes)))
            best = int(top_i[0])
            if float(top_p[0]) < self.threshold:
                status = "uncertain"
            elif is_healthy(self.model.classes[best]):
                status = "healthy"
            else:
                status = "disease"

            cam = None
            if status == "disease":
                acts = self._activations
                (grads,) = torch.autograd.grad(logits[0, best], acts)
                weights = grads[0].mean(dim=(1, 2))
                cam = torch.relu((weights[:, None, None] * acts[0]).sum(dim=0)).detach().numpy()
            self._activations = None

        top = [{"class_id": self.model.classes[int(i)], "probability": round(float(p), 4)}
               for p, i in zip(top_p, top_i)]
        att = heatmap.attention(display, cam) if cam is not None else None
        return {
            "status": status,
            "prediction": top[0],
            "top": top,
            "image": heatmap.to_data_url(display),
            # Two see-through PNG layers that the browser puts over the photo (None without a disease).
            "focus": heatmap.to_data_url(heatmap.focus_layer(att)) if att is not None else None,
            "heatmap": heatmap.to_data_url(heatmap.heat_layer(att)) if att is not None else None,
        }
