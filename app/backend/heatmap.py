"""Image helpers: square crop, the subject masks, and the Grad-CAM layers sent to the browser.

The browser draws the result itself from two transparent PNG layers (see ResultView.jsx):
- `focus`: white with the attention as alpha, used as a CSS mask so the looked-at parts stay bright
  while the rest of the photo is dimmed;
- `heatmap`: a classic coloured Grad-CAM overlay.
"""

from __future__ import annotations

import base64
import io

import numpy as np
from PIL import Image
from scipy import ndimage

# Leaf mask: used only when the photo looks like PlantVillage (one leaf on a plain background).
MIN_LEAF_SHARE = 0.05  # the leaf must cover at least 5% of the photo ...
MAX_LEAF_SHARE = 0.95  # ... and must not be the whole photo
MAX_BACKGROUND_CHROMA = 35  # a plain grey background has little colour (0-255 scale)

# Focus mask: on other photos (in the field), blurred background counts much less than sharp parts.
BLURRED = 0.05  # sharpness below 5% of the sharpest parts counts as blurred ...
SHARP = 0.3  # ... and above 30% as in focus
BLURRED_WEIGHT = 0.2  # how much of the attention on blurred parts is kept

LAYER_SIZE = 256  # size of the masks and PNG layers; the browser scales the layers smoothly to the photo

# The focus view lights up attention from FOCUS_LOW (nothing) to FOCUS_HIGH (fully bright).
FOCUS_LOW, FOCUS_HIGH = 0.3, 0.75

# Heatmap colours, from weak to strong attention (keep in step with HEAT_GRADIENT in ResultView.jsx).
_STOPS = np.array([0.0, 0.4, 0.7, 1.0])
_COLORS = np.array([[253, 224, 71], [251, 146, 60], [239, 68, 68], [190, 18, 60]], dtype=np.float32)


def center_square(image: Image.Image) -> Image.Image:
    """The largest square in the middle of the photo (PlantVillage photos are already square)."""
    width, height = image.size
    side = min(width, height)
    left, top = (width - side) // 2, (height - side) // 2
    return image.crop((left, top, left + side, top + side))


def to_data_url(image: Image.Image, quality: int = 88) -> str:
    buffer = io.BytesIO()
    if image.mode in ("RGBA", "LA"):
        image.save(buffer, format="PNG", optimize=True)
        return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")
    image.convert("RGB").save(buffer, format="JPEG", quality=quality)
    return "data:image/jpeg;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")


def _otsu_threshold(values: np.ndarray) -> int:
    """The threshold that best splits the values into two groups (Otsu's method)."""
    hist = np.bincount(values.ravel(), minlength=256).astype(np.float64)
    omega = np.cumsum(hist) / hist.sum()
    mu = np.cumsum(hist * np.arange(256)) / hist.sum()
    with np.errstate(divide="ignore", invalid="ignore"):
        between = (mu[-1] * omega - mu) ** 2 / (omega * (1 - omega))
    return int(np.argmax(np.nan_to_num(between)))


def leaf_mask(rgb: np.ndarray) -> np.ndarray | None:
    """A boolean mask of the leaf, or None when the photo has no plain background.

    PlantVillage photos show one leaf on a plain grey background, so the leaf is the large
    region with clearly more colour (chroma = max - min of R, G, B) than the background.
    Holes are filled, so dark disease spots inside the leaf stay in the mask.
    """
    chroma = (rgb.max(axis=2).astype(np.int16) - rgb.min(axis=2)).astype(np.uint8)
    mask = ndimage.binary_opening(chroma > _otsu_threshold(chroma), iterations=2)
    labels, count = ndimage.label(mask)
    if count == 0:
        return None
    sizes = ndimage.sum_labels(mask, labels, index=np.arange(1, count + 1))
    leaf = ndimage.binary_fill_holes(labels == int(np.argmax(sizes)) + 1)
    share = leaf.mean()
    if not MIN_LEAF_SHARE <= share <= MAX_LEAF_SHARE:
        return None
    if chroma[~leaf].mean() > MAX_BACKGROUND_CHROMA:
        return None
    return ndimage.binary_dilation(leaf, iterations=3)


def focus_mask(rgb: np.ndarray) -> np.ndarray:
    """A weight per pixel: 1 where the photo is in focus, BLURRED_WEIGHT where it is blurred.

    Sharpness is the local amount of fine detail (Laplacian), averaged over a few percent of the
    photo and compared with the sharpest parts. Phone photos of a plant often have a blurred
    background, and the model should be shown looking at the leaves in focus, not at the blur.
    """
    gray = rgb.astype(np.float32).mean(axis=2)
    side = min(gray.shape)
    detail = np.abs(ndimage.laplace(ndimage.gaussian_filter(gray, side / 400)))
    sharpness = ndimage.gaussian_filter(detail, side / 25)
    top = np.percentile(sharpness, 95)
    if top <= 0:
        return np.ones_like(gray)
    weight = _smoothstep(sharpness / top, BLURRED, SHARP)
    weight = ndimage.gaussian_filter(weight, side / 20)  # no hard edge between sharp and blurred parts
    return BLURRED_WEIGHT + (1 - BLURRED_WEIGHT) * weight


def attention(display: Image.Image, cam: np.ndarray) -> np.ndarray | None:
    """The Grad-CAM map at LAYER_SIZE, kept to the subject and scaled to 0..1 (None if it is empty).

    On a PlantVillage-style photo it is kept to the leaf; on other photos blurred parts count less.
    """
    size = (LAYER_SIZE, LAYER_SIZE)
    rgb = np.asarray(display.convert("RGB").resize(size, Image.Resampling.BILINEAR))
    cam = np.asarray(Image.fromarray(cam.astype(np.float32)).resize(size, Image.Resampling.BICUBIC))
    cam = np.clip(cam, 0, None)

    mask = leaf_mask(rgb)
    if mask is not None:
        cam = cam * ndimage.gaussian_filter(mask.astype(np.float32), sigma=1)
    else:
        cam = cam * focus_mask(rgb)
    peak = cam.max()
    return cam / peak if peak > 0 else None


def _smoothstep(values: np.ndarray, low: float, high: float) -> np.ndarray:
    t = np.clip((values - low) / (high - low), 0, 1)
    return t * t * (3 - 2 * t)


def focus_layer(att: np.ndarray) -> Image.Image:
    """White with alpha = how strongly the model looked there (a CSS mask for the focus view)."""
    alpha = _smoothstep(att, FOCUS_LOW, FOCUS_HIGH)
    white = np.full(alpha.shape, 255, np.uint8)
    return Image.fromarray(np.stack([white, (alpha * 255).round().astype(np.uint8)], axis=-1), "LA")


def heat_layer(att: np.ndarray) -> Image.Image:
    """A see-through coloured heatmap: weak attention is clear, strong attention is deep red."""
    color = np.stack([np.interp(att, _STOPS, _COLORS[:, c]) for c in range(3)], axis=-1)
    alpha = 0.62 * _smoothstep(att, 0.12, 1.0)
    rgba = np.concatenate([color, alpha[..., None] * 255], axis=-1)
    return Image.fromarray(rgba.round().astype(np.uint8), "RGBA")
