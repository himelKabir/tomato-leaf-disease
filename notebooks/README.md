# Running the notebooks

The six notebooks are the training source. They run on Kaggle and locate earlier outputs under `/kaggle/input`. Import each `.ipynb` into Kaggle, attach the inputs below, inspect the configuration cell, and use **Save Version -> Save & Run All**.

Use the Kaggle dataset `abdallahalidev/plantvillage-dataset`, specifically its `color` directory and ten tomato classes. The repository's `data/` directory contains the frozen split and class metadata, not the images. Upload this metadata as a Kaggle input, keeping `splits.csv` and `classes.json` adjacent. Do not regenerate the split when reproducing the saved comparisons: its fingerprint is `7cf95c207559517a`.

| Order | Notebook | Inputs and purpose |
| --- | --- | --- |
| 1 | `01_data.ipynb` | PlantVillage images; groups related photos and creates the 70/15/15 split. Its final metadata is already included in `../data/`. |
| 2 | `02_base_models.ipynb` | PlantVillage plus frozen split metadata; trains the four real-only baseline classifiers. Use `FINAL = True` for three seeds and final evaluation. |
| 3 | `03_gan_train.ipynb` | PlantVillage plus frozen split metadata; trains conditional StyleGAN2-ADA using training images only. Internet is required to obtain the pinned NVIDIA code and dependencies. |
| 4 | `03_gan_generate.ipynb` | PlantVillage, split metadata, final baseline ResNet50 checkpoint, and newest GAN output with `progress.json` and `snapshots/`; generates and checks synthetic images. |
| 5 | `04_retrain.ipynb` | PlantVillage, split metadata, baseline `02_final_runs.json`, and complete synthetic output; trains rows B-E and compares with row A. |
| 6 | `05_app_files.ipynb` | PlantVillage, split metadata, baseline results, complete synthetic output, and completed retraining output with sibling `results/` and `models/`; exports model, photos, and frontend data. Add `03_summary.json` for GAN quality facts. |

Use CPU for notebooks 01 and 05, and a T4 GPU accelerator for notebooks 02-04 and GAN generation. Follow each notebook's own settings; the notebooks install their extra GAN dependencies as needed. GPU time limits and available quota should determine session duration.

## Continuing training

Notebook 03's training step and notebook 04 support multiple sessions. Attach the newest previous output as an input. Preserve the full directory layout: GAN `progress.json` next to `snapshots/`, and retraining `results/` next to `models/`. Keep the original inputs attached too. Confirm the notebook reports the expected continuation before committing another session.

The completed study reached 1,200 kimg over five GAN sessions and generated 9,049 retained synthetic images. Its baseline has 12 runs and retraining has 48 runs. The compact records are in `../results/`; full GAN snapshots, synthetic images, and training checkpoints are excluded from this repository. Train them again or supply your separately saved outputs to continue/export. The bundled app checkpoint is sufficient to run the demo but is not a replacement for the baseline ResNet50 or GAN checkpoints required by the training pipeline.

## App export

Keep `APP_ARCH = 'mobilenet_v2'`, `APP_ROW = None`, and `REQUIRE_COMPLETE_COMPARISON = True` for the complete study export. Notebook 05 chooses the row by mean validation macro-F1, verifies all 60 runs, and writes `app_files.zip` mirroring the repository's `app/` directory. After reviewing the export, extract it into the repository root and restart the app.

The completed study's reviewed export selected MobileNetV2 row C (oversampling), seed 2, epoch 15, with confidence threshold 0.93. This repository preserves the existing working app's earlier baseline export; the final export has not been substituted during packaging.

Keep the frozen split and training settings consistent across rows. Choose models, seeds, epochs, and confidence thresholds using validation data. Use the test split only for evaluation. Inspect the generated-image quality diagnostics before relying on GAN supplementation.
