"""Backend tests. Run from app/backend:  python -m pytest"""

import base64
import io
import os

os.environ["MODEL_PATH"] = "no-such-model.pt"  # the tests use the untrained placeholder

import numpy as np
import pytest
import torch
from fastapi.testclient import TestClient
from PIL import Image
from scipy import ndimage

import heatmap
import main
from model import (ARCHS, DEFAULT_CLASSES, LoadedModel, ModelLoadError, Predictor, _custom_cnn, _mobilenet_v2,
                   load_model)


def fake_leaf(size=256) -> tuple[Image.Image, np.ndarray]:
    """A green ellipse with brown and black spots on a plain grey background, like PlantVillage."""
    rng = np.random.default_rng(0)
    yy, xx = np.mgrid[:size, :size]
    leaf = ((xx - size / 2) / (size * 0.32)) ** 2 + ((yy - size / 2) / (size * 0.42)) ** 2 <= 1
    img = np.full((size, size, 3), (150, 150, 145), np.float32)
    img[leaf] = (60, 130, 50)
    for cx, cy, color in [(0.45, 0.4, (110, 70, 40)), (0.55, 0.6, (30, 25, 20))]:
        spot = (xx - size * cx) ** 2 + (yy - size * cy) ** 2 <= (size * 0.05) ** 2
        img[spot] = color
    img += rng.normal(0, 4, img.shape)
    return Image.fromarray(img.clip(0, 255).astype(np.uint8)), leaf


def jpeg_bytes(image: Image.Image) -> bytes:
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG")
    return buffer.getvalue()


def test_leaf_mask_covers_leaf_and_its_dark_spots():
    image, truth = fake_leaf()
    mask = heatmap.leaf_mask(np.asarray(image))
    assert mask is not None
    iou = (mask & truth).sum() / (mask | truth).sum()
    assert iou > 0.9
    assert mask[int(256 * 0.6), int(256 * 0.55)]  # the black spot is inside the mask


def test_leaf_mask_skips_photos_without_plain_background():
    assert heatmap.leaf_mask(np.full((128, 128, 3), (60, 130, 50), np.uint8)) is None
    noise = np.random.default_rng(1).integers(0, 256, (128, 128, 3), dtype=np.uint8)
    assert heatmap.leaf_mask(noise) is None


def test_center_square():
    assert heatmap.center_square(Image.new("RGB", (400, 300))).size == (300, 300)


def placeholder(classes=DEFAULT_CLASSES) -> LoadedModel:
    torch.manual_seed(0)
    net, layer = _mobilenet_v2(len(classes))
    return LoadedModel(net.eval(), layer, "mobilenet_v2", list(classes), "test", trained=False)


def decode(data_url: str) -> Image.Image:
    return Image.open(io.BytesIO(base64.b64decode(data_url.split(",", 1)[1])))


def test_focus_mask_lowers_blurred_parts():
    """Left half sharp (fine noise), right half blurred: the right half gets a low weight."""
    rng = np.random.default_rng(2)
    rgb = rng.integers(0, 256, (256, 256, 3)).astype(np.float32)
    rgb[:, 128:] = ndimage.gaussian_filter(rgb[:, 128:], sigma=(8, 8, 0))
    weight = heatmap.focus_mask(rgb.astype(np.uint8))
    assert weight[:, :64].mean() > 0.9
    assert weight[:, -64:].mean() < 0.4


def test_attention_is_kept_to_the_leaf():
    image, leaf = fake_leaf(heatmap.LAYER_SIZE)
    att = heatmap.attention(image, np.ones((7, 7), np.float32))
    assert att.shape == leaf.shape and att.max() == pytest.approx(1)
    assert att[leaf].mean() > 0.9 and att[:20, :20].max() < 0.05  # the corner is background


def test_empty_attention_is_none():
    assert heatmap.attention(fake_leaf()[0], np.zeros((7, 7), np.float32)) is None


def test_disease_result_has_layers():
    result = Predictor(placeholder(), threshold=0.0).predict(fake_leaf(400)[0])
    assert result["status"] == "disease"
    assert len(result["top"]) == 3
    assert decode(result["image"]).size == (400, 400)
    focus, heat = decode(result["focus"]), decode(result["heatmap"])
    assert result["focus"].startswith("data:image/png;base64,") and focus.mode == "LA"
    assert result["heatmap"].startswith("data:image/png;base64,") and heat.mode == "RGBA"
    assert focus.size == heat.size == (heatmap.LAYER_SIZE, heatmap.LAYER_SIZE)
    assert np.asarray(focus)[..., 1].max() == 255  # the strongest part is fully shown


def test_low_confidence_is_uncertain_without_layers():
    result = Predictor(placeholder(), threshold=1.01).predict(fake_leaf()[0])
    assert result["status"] == "uncertain" and result["heatmap"] is None and result["focus"] is None


def test_healthy_result_has_no_layers():
    result = Predictor(placeholder(["Tomato___healthy"] * 10), threshold=0.0).predict(fake_leaf()[0])
    assert result["status"] == "healthy" and result["heatmap"] is None and result["focus"] is None


@pytest.mark.parametrize("prefix", ["", "module."])
def test_checkpoint_round_trip(tmp_path, prefix):
    torch.manual_seed(1)
    net, _ = _mobilenet_v2(len(DEFAULT_CLASSES))
    net.eval()
    path = tmp_path / "model.pt"
    torch.save({
        "arch": "mobilenet_v2",
        "classes": DEFAULT_CLASSES,
        "state_dict": {prefix + k: v for k, v in net.state_dict().items()},
        "name": "Test model",
        "metrics": {"test_accuracy": 0.99},
    }, path)

    loaded = load_model(path)
    assert loaded.trained and loaded.name == "Test model" and loaded.classes == DEFAULT_CLASSES
    x = torch.randn(1, 3, 224, 224)
    with torch.no_grad():
        assert torch.allclose(loaded.net(x), net(x), atol=1e-5)


def test_checkpoint_with_classes_json_entries(tmp_path):
    """Notebook 02 may save data/classes.json as it is: a list of {label, folder, name}."""
    net, _ = _mobilenet_v2(len(DEFAULT_CLASSES))
    entries = [{"label": i, "folder": f, "name": f.split("___")[1]} for i, f in enumerate(DEFAULT_CLASSES)]
    path = tmp_path / "model.pt"
    torch.save({"arch": "mobilenet_v2", "classes": entries[::-1], "state_dict": net.state_dict()}, path)
    assert load_model(path).classes == DEFAULT_CLASSES


def test_missing_checkpoint_gives_placeholder(tmp_path):
    assert load_model(tmp_path / "missing.pt").trained is False


@pytest.mark.parametrize("arch", sorted(ARCHS))
def test_every_arch_loads_and_shows_a_heatmap(tmp_path, arch):
    """MobileNetV2, ResNet50, VGG16 and the custom CNN of notebook 02 all load and give a Grad-CAM map."""
    torch.manual_seed(2)
    net, _ = ARCHS[arch](len(DEFAULT_CLASSES))
    path = tmp_path / "model.pt"
    torch.save({"arch": arch, "classes": DEFAULT_CLASSES, "state_dict": net.state_dict(), "img_size": 64}, path)
    loaded = load_model(path)
    assert loaded.arch == arch and loaded.img_size == 64
    result = Predictor(loaded, threshold=0.0).predict(fake_leaf(200)[0])
    assert result["status"] in {"disease", "healthy"}
    if result["status"] == "disease":
        assert result["focus"] and result["heatmap"]


@pytest.mark.parametrize("arch", sorted(ARCHS))
def test_bare_state_dict_is_recognised(tmp_path, arch):
    net, _ = ARCHS[arch](len(DEFAULT_CLASSES))
    path = tmp_path / "weights.pt"
    torch.save(net.state_dict(), path)
    loaded = load_model(path)
    assert loaded.trained and loaded.arch == arch and loaded.classes == DEFAULT_CLASSES


def test_threshold_and_details_come_from_the_checkpoint(tmp_path):
    net, _ = _custom_cnn(len(DEFAULT_CLASSES))
    path = tmp_path / "model.pt"
    torch.save({"arch": "custom_cnn", "classes": DEFAULT_CLASSES, "state_dict": net.state_dict(),
                "confidence_threshold": 0.83, "training_images": "Real + GAN", "row": "D", "seed": 1}, path)
    loaded = load_model(path)
    assert loaded.threshold == pytest.approx(0.83)
    assert loaded.details == {"training_images": "Real + GAN", "row": "D", "seed": 1}


def test_unusable_files_give_a_clear_error(tmp_path):
    net, _ = _mobilenet_v2(len(DEFAULT_CLASSES))
    cases = {
        "garbage.pt": b"not a checkpoint",
        "whole_model.pt": net,                                       # torch.save(model) instead of a dict
        "wrong_arch.pt": {"arch": "resnet50", "classes": DEFAULT_CLASSES, "state_dict": net.state_dict()},
        "wrong_classes.pt": {"arch": "mobilenet_v2", "classes": DEFAULT_CLASSES[:5], "state_dict": net.state_dict()},
        "unknown_arch.pt": {"arch": "efficientnet", "state_dict": net.state_dict()},
    }
    for name, content in cases.items():
        path = tmp_path / name
        if isinstance(content, bytes):
            path.write_bytes(content)
        else:
            torch.save(content, path)
        with pytest.raises(ModelLoadError):
            load_model(path)


client = TestClient(main.app)


def test_api_info():
    body = client.get("/api/info").json()
    assert body["trained"] is False and len(body["classes"]) == 10
    assert body["load_error"] is None and body["threshold_source"] == "placeholder"
    assert body["model_file"].endswith("no-such-model.pt")


def test_api_predict():
    response = client.post("/api/predict", files={"file": ("leaf.jpg", jpeg_bytes(fake_leaf()[0]), "image/jpeg")})
    assert response.status_code == 200
    body = response.json()
    assert body["status"] in {"disease", "healthy", "uncertain"}
    assert body["prediction"] == body["top"][0]
    assert sum(t["probability"] for t in body["top"]) <= 1.0001
    assert body["model"]["trained"] is False


def test_api_rejects_non_images():
    response = client.post("/api/predict", files={"file": ("notes.txt", b"hello", "text/plain")})
    assert response.status_code == 400
