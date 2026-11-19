"""FastAPI backend: loads the model once, answers POST /api/predict, and serves the built frontend.

Run from this folder:  python -m uvicorn main:app --reload
"""

from __future__ import annotations

import io
import logging
import os
import time
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image, ImageOps, UnidentifiedImageError

from model import ModelLoadError, Predictor, load_model, placeholder

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger("app")

APP_DIR = Path(__file__).resolve().parents[1]
# The app's model: app/models/model.pt (notebook 05 writes it). MODEL_PATH points somewhere else.
MODEL_PATH = Path(os.environ.get("MODEL_PATH", APP_DIR / "models" / "model.pt")).resolve()
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
FRONTEND_DIST = APP_DIR / "frontend" / "dist"
DEFAULT_THRESHOLD = 0.6


def _shown_path(path: Path) -> str:
    """The model path as shown on the page: relative to the project folder when it is inside it."""
    try:
        return path.relative_to(APP_DIR.parent).as_posix()
    except ValueError:
        return path.name


load_error = None
try:
    model = load_model(MODEL_PATH)
except ModelLoadError as err:
    # Keep the app running and say what is wrong on the page, instead of a server that does not start.
    load_error = str(err)
    log.error("The model could not be loaded: %s. Using the untrained placeholder.", err)
    model = placeholder()

# Below this confidence the app says "Not sure, please retake". In order: the CONFIDENCE_THRESHOLD environment
# variable, the threshold saved in the model file (chosen on the validation split by notebook 05), 0.6.
# The untrained placeholder gives every class about 10%, so it uses 0: otherwise every demo result would be
# "Not sure" and the disease and healthy pages could not be seen.
if os.environ.get("CONFIDENCE_THRESHOLD"):
    CONFIDENCE_THRESHOLD, THRESHOLD_SOURCE = float(os.environ["CONFIDENCE_THRESHOLD"]), "environment variable"
elif not model.trained:
    CONFIDENCE_THRESHOLD, THRESHOLD_SOURCE = 0.0, "placeholder"
elif model.threshold is not None:
    CONFIDENCE_THRESHOLD, THRESHOLD_SOURCE = model.threshold, "model file"
else:
    CONFIDENCE_THRESHOLD, THRESHOLD_SOURCE = DEFAULT_THRESHOLD, "default"
log.info('"Not sure" below %.0f%% confidence (%s)', 100 * CONFIDENCE_THRESHOLD, THRESHOLD_SOURCE)

predictor = Predictor(model, CONFIDENCE_THRESHOLD)
app = FastAPI(title="Tomato Leaf Disease Detection API")


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/info")
def info() -> dict:
    return {
        **predictor.info(),
        "threshold_source": THRESHOLD_SOURCE,
        "model_file": _shown_path(MODEL_PATH),
        "load_error": load_error,
    }


@app.post("/api/predict")
def predict(file: UploadFile = File(...)) -> dict:
    data = file.file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "The photo is larger than 10 MB. Please use a smaller photo.")
    try:
        image = Image.open(io.BytesIO(data))
        image.draft("RGB", (1024, 1024))  # decode large JPEGs at a smaller size: faster
        image = ImageOps.exif_transpose(image).convert("RGB")
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
        raise HTTPException(400, "This file is not a photo the app can read. Please use a JPG or PNG photo.")

    start = time.perf_counter()
    result = predictor.predict(image)
    result["time_ms"] = round((time.perf_counter() - start) * 1000)
    result["model"] = {"name": predictor.model.name, "trained": predictor.model.trained}
    return result


# The built frontend (npm run build), so one server runs the whole app. Unknown pages get
# index.html, because the React router handles them in the browser.
if FRONTEND_DIST.is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def frontend(path: str) -> FileResponse:
        file = (FRONTEND_DIST / path).resolve()
        if path and file.is_file() and FRONTEND_DIST.resolve() in file.parents:
            return FileResponse(file)
        if path.startswith("api/") or Path(path).suffix:
            raise HTTPException(404, "Not found")
        return FileResponse(FRONTEND_DIST / "index.html")
