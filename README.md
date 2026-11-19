# Tomato Leaf Disease Classification

A tomato leaf classification project with a React web app, a FastAPI/PyTorch backend, Grad-CAM explanations, and six Kaggle notebooks for data preparation, classifier training, GAN training, and evaluation.

The research compares Custom CNN, VGG16, ResNet50, and MobileNetV2 across five training conditions: real images only, ordinary augmentation, oversampling, GAN supplementation, and GAN supplementation with augmentation. The final experiment records contain 60 runs across three seeds.

## Repository contents

| Path | Contents |
| --- | --- |
| `app/` | Backend, frontend source, library photos, Docker setup, dependencies, tests, and the current app model |
| `notebooks/` | Six training/export notebooks and their run guide |
| `data/` | Frozen split manifest, class definitions, and split metadata; no training images |
| `results/` | Compact final baseline/comparison tables, run histories, and GAN quality metrics |
| `run-app.bat` | Windows launcher |

This copy includes the current working app: its MobileNetV2 real-only checkpoint and baseline results page. The complete experiment results are in `results/comparison/`. Notebook 05 can export the validation-selected comparison model and updated frontend data; this packaging step does not apply that export.

## Run the app

Install Python 3.11+ and Node.js 22+. From this repository folder on Windows:

```powershell
.\run-app.bat
```

The launcher installs missing dependencies, builds the frontend, and opens <http://localhost:8000>. To open the app from a phone on the same Wi-Fi, run `.\run-app.bat phone`.

For a manual setup on Windows, macOS, or Linux:

```sh
python -m pip install -r app/backend/requirements.txt
cd app/frontend
npm ci
npm run build
cd ../backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Use a virtual environment if preferred. See [the app guide](app/README.md) for development mode, environment variables, checkpoint format, and Docker deployment.

## Deploy to Vercel

Live app: [Tomato Leaf Check](https://tomato-leaf-disease-sigma.vercel.app).

This repository is connected to the Vercel project `tomato-leaf-disease`; pushes to `main` deploy automatically. Follow [the Vercel guide](app/VERCEL.md) for project settings or deployment into another account. The project uses Root Directory `app`, the **FastAPI** framework, and `VERCEL_SUPPORT_LARGE_FUNCTIONS=1` for the CPU-only PyTorch bundle.

## Reproduce the experiments

Follow [the notebook run guide](notebooks/README.md). The source dataset is the Kaggle dataset `abdallahalidev/plantvillage-dataset`, using the `color` folder's ten tomato classes. Obtain the images separately and retain the existing `data/splits.csv` for comparisons with the saved results. The frozen split has 12,698 training, 2,728 validation, and 2,734 test images; fingerprint `7cf95c207559517a`.

Full datasets, generated image collections, GAN snapshots, training checkpoints, temporary uploads, repeated session outputs, manuscript drafts, dependency folders, and build outputs are excluded. The small checkpoint required by the app is included at `app/models/model.pt`. Classifier and GAN training produce the other artifacts described in the notebook guide.

The saved comparison does not establish a consistent advantage from GAN supplementation. Model/epoch/seed selection and the confidence threshold use validation data; test scores are for evaluation.

## Backend tests

```sh
cd app/backend
python -m pip install -r requirements-dev.txt
python -m pytest
```

## Upload to GitHub

Create an empty repository in your GitHub account, then run these commands inside this folder, replacing the remote URL:

```sh
git init
git add .
git commit -m "Initial project upload"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Commit the contents of this folder as the repository root. The supplied `.gitignore` keeps local environments, credentials, caches, dependency folders, and large training artifacts out of subsequent commits.
