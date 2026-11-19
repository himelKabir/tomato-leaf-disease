---
title: Tomato Leaf Check
emoji: 🍅
colorFrom: green
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# Tomato Leaf Check: the web app

Upload or take a photo of a tomato leaf and see the disease (or "Healthy leaf"), the confidence, the top 3
answers, the diseased part highlighted with Grad-CAM, and the symptoms, treatment and prevention.

- `backend/`: FastAPI. Loads the model once; `POST /api/predict` returns the result; also serves the built frontend.
- `frontend/`: React + Vite + Tailwind CSS. Pages: Detect, Diseases (library), About. Phone-first, light and dark mode.
- `models/model.pt`: the trained model the app uses.

(The block at the top of this file is for Hugging Face Spaces; see "Put it online" below.)

## Run it

**Easiest (Windows):** double-click `run-app.bat` in the project folder, or type `.\run-app` in a terminal there.
It installs missing packages (first time only), builds the page, starts the server and opens
http://localhost:8000. `.\run-app phone` also prints the address to open on a phone on the same Wi-Fi.
Stop it with Ctrl+C or by closing the window.

The steps below do the same by hand. Needs Python 3.11+ and Node.js 20+.

**Once:**

```
cd app/backend
pip install -r requirements.txt
cd ../frontend
npm install
```

**While developing** (two terminals; the page reloads when you edit code):

```
cd app/backend   →  python -m uvicorn main:app --reload
cd app/frontend  →  npm run dev
```

Open http://localhost:5173. The frontend sends `/api` requests to the backend on port 8000.

**As one server** (as it will run online):

```
cd app/frontend  →  npm run build
cd app/backend   →  python -m uvicorn main:app
```

Open http://localhost:8000.

**On your phone:** start the backend with `--host 0.0.0.0` (one-server way), connect the phone to the same Wi-Fi,
and open `http://<laptop IP>:8000`. "Take photo" opens the phone camera.

## The model

The backend loads **`app/models/model.pt`** when it starts. Now it holds the final MobileNetV2 of notebook 02 (a copy
of `models-final/model.pt`). To use another model, set the environment variable `MODEL_PATH` to its file.

### Putting a new model into the app

The easy way is notebook 05 (`notebooks/05_app_files.ipynb`): it picks the model (on the validation split), stores
its "not sure" threshold in it, and makes `app_files.zip`. Unzip that in the project folder, replacing the files, and
restart the app. By hand:

1. Copy the model file to `app/models/model.pt` (replace the old one).
2. Restart the app (close the `run-app.bat` window and start it again). The backend reads the model only at start.
3. Check it: the window prints `INFO: Loaded <name> (<arch>, 10 classes) from ...app\models\model.pt`, the "Demo mode"
   banner is gone, and the **About** page shows the model's name, what it was trained on, its threshold and scores.

The app accepts any of the four models of notebooks 02 and 04 (`mobilenet_v2`, `resnet50`, `vgg16`, `custom_cnn`), in
the checkpoint format the notebooks save:

```python
torch.save({
    "arch": "mobilenet_v2",              # or "resnet50", "vgg16", "custom_cnn"
    "classes": classes,                  # data/classes.json as loaded (or its folder names in label order)
    "state_dict": model.state_dict(),
    "img_size": 224,
    "name": "MobileNetV2 (real + GAN)",  # shown on the About page
    "metrics": {"test_accuracy": 0.99},  # shown on the About page
    "confidence_threshold": 0.85,        # optional: "Not sure" below this (notebook 05 sets it)
}, "model.pt")
```

A bare `torch.save(model.state_dict(), "model.pt")` also works: the app recognises the architecture from the weight
names and assumes the 10 classes in sorted folder order. A whole model saved with `torch.save(model)` does not work
(the app only loads weights, which is also the safe way). The last layer must be replaced as in the notebooks and in
`backend/model.py`: MobileNetV2 `classifier[1]`, ResNet50 `fc`, VGG16 `classifier[6]`, each one `nn.Linear` to 10
classes; the custom CNN is notebook 02's `CustomCNN`.

**If something is wrong**, the app still starts and says what: no file → amber "Demo mode" banner (an untrained
placeholder answers at random); a file it cannot use → red banner with the reason (for example "has 5 outputs but 10
classes"). Speed on a laptop CPU, with the heatmap: MobileNetV2 about 0.4 s per photo, ResNet50 0.7 s, VGG16 1.2 s.

### The "not sure" threshold

Below this confidence the app says "Not sure, please retake". It comes from, in this order:

| Source | When |
|---|---|
| environment variable `CONFIDENCE_THRESHOLD` (e.g. `0.8`) | if set |
| `confidence_threshold` in `model.pt` | notebook 05 chooses it on the validation split: 99% of the correct validation answers are above it |
| `0.6` | otherwise |

The About page shows the value and where it came from. Do not choose it by looking at the test split.

## How the result is made

1. The photo is cropped to the centre square and resized to 224 × 224 (PlantVillage photos are already square).
2. The model gives a probability for each of the 10 classes. Below the threshold → "Not sure". Healthy → care tips,
   no heatmap.
3. For a disease, Grad-CAM is computed for the predicted class on the last convolutional layer.
4. A rough leaf mask (the leaf has more colour than PlantVillage's plain grey background) keeps the map on the
   leaf. On photos without a plain background, a focus mask lowers the map on blurred parts (a phone photo's
   blurred background), so it stays on the leaves in focus. See `backend/heatmap.py`.
5. The server sends two see-through 256 px PNG layers: `focus` (white, alpha = attention), which the browser uses
   as a CSS mask to keep the looked-at parts bright and dim the rest (the default "Focus" view), and `heatmap`
   (yellow → red, the classic Grad-CAM overlay). Both are `null` for "Healthy" and "Not sure".

## Content from the notebooks

Notebook 05 writes these (until then the app shows a leaf drawing and "added later" notes):

- **Library photos:** `frontend/public/library/<slug>.jpg`, one typical training photo per class.
- **Results table:** `frontend/src/data/results.js` (rows A–E × 4 models; now row A from notebook 02).
- **GAN images:** `frontend/public/gan/*.jpg` and `frontend/src/data/gan.js` (null until notebook 03 has run).

The disease texts (symptoms, treatment, prevention) are in `frontend/src/data/diseases.js`. Have them checked
before the presentation.

## Put it online (Hugging Face Spaces, free)

The `Dockerfile` in this folder builds the page and runs the server on port 7860, as Spaces expects. Not tested
here (Docker is not installed on this laptop); if the build fails on Spaces, its log says which step.

1. huggingface.co → **New Space** → name it, **SDK: Docker** (blank template), hardware **CPU basic** (free).
2. **Files → Add file → Upload files**: upload the *contents* of this `app/` folder (`Dockerfile`, `README.md`,
   `backend/`, `frontend/` without `node_modules` and `dist`, `models/`). The web upload handles the model file.
3. The Space builds (5–10 minutes the first time) and then runs at `https://huggingface.co/spaces/<you>/<name>`.

To update the model online, upload the new `models/model.pt` the same way; the Space rebuilds itself.

## Tests

```
cd app/backend
pip install -r requirements-dev.txt
python -m pytest
```
