// Made by notebooks/05_app_files.ipynb; edit the notebook, not this file, if the numbers change.
// The test-split results shown on the About page: the mean (and sd) of 3 seeds per model and training set.
// Row A comes from notebook 02, rows B-E from notebook 04.
export const trainingSets = ["Real only", "Real + ordinary augmentation", "Real, small classes repeated", "Real + GAN", "Real + GAN + ordinary augmentation"]

export const results = [
  {"model": "Custom CNN", "images": "Real only", "accuracy": 0.9916, "macroF1": 0.9895, "accuracySd": 0.002, "macroF1Sd": 0.002},
  {"model": "VGG16", "images": "Real only", "accuracy": 0.9927, "macroF1": 0.9902, "accuracySd": 0.0054, "macroF1Sd": 0.0067},
  {"model": "ResNet50", "images": "Real only", "accuracy": 0.997, "macroF1": 0.9959, "accuracySd": 0.0012, "macroF1Sd": 0.002},
  {"model": "MobileNetV2", "images": "Real only", "accuracy": 0.9949, "macroF1": 0.993, "accuracySd": 0.0013, "macroF1Sd": 0.002},
]
