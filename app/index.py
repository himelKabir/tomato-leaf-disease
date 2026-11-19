"""Vercel entrypoint for the prediction API and the built React app."""

from pathlib import Path
import sys

from fastapi import HTTPException
from fastapi.responses import FileResponse

APP_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = APP_DIR / "public"
# The backend also runs directly with `uvicorn main:app` in local/Docker setups.
sys.path.insert(0, str(APP_DIR / "backend"))
from main import app  # noqa: E402


@app.get("/{path:path}", include_in_schema=False)
def vercel_frontend(path: str) -> FileResponse:
    """Keep React routes working on refresh while preserving missing API errors."""
    if path == "api" or path.startswith("api/"):
        raise HTTPException(404, "Not found")

    file = (PUBLIC_DIR / path).resolve()
    if path and PUBLIC_DIR in file.parents and file.is_file():
        return FileResponse(file)
    if Path(path).suffix:
        raise HTTPException(404, "Not found")

    index = PUBLIC_DIR / "index.html"
    if not index.is_file():
        raise HTTPException(503, "The frontend has not been built.")
    return FileResponse(index)
