# Final experiment records

These are the compact records from the completed runs. They retain the original filenames and bytes; only their parent directories have been simplified for this repository.

| Directory | Original source | Contents |
| --- | --- | --- |
| `baseline/` | `results-final/` | Notebook 02's final summary, 12 runs, per-class metrics, and JSON with settings, histories, and confusion matrices |
| `comparison/` | `results-04-session2/results/` | Notebook 04's completed comparison tables, 48 retraining runs, per-class metrics, and run JSON; comparison summaries include baseline row A |
| `gan/` | `results-03-gan-generate/` | Generation summary and per-class quality diagnostics |
| `gan/gan_fid_trajectory.csv` | `Elsevier_array/supplementary/gan_fid_trajectory.csv` | Compact FID trajectory across all five GAN sessions |

Baseline JSON and comparison JSON together contain all 60 runs. Models are Custom CNN, VGG16, ResNet50, and MobileNetV2, each with seeds 0, 1, and 2. Rows are A: real only; B: ordinary augmentation; C: oversampling; D: real plus GAN; E: real plus GAN and augmentation.

Use `../data/` for the frozen split and class labels. Full images, classifier checkpoints, GAN snapshots, plots, intermediate sessions, and export archives are not included here. The app's existing runtime checkpoint remains in `../app/models/model.pt`.
