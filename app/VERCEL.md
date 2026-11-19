# Deploy the complete app to Vercel

The repository includes a Vercel entrypoint for FastAPI and a build script for React. Both use one deployment URL: Vercel serves built frontend assets from `public/`, and FastAPI handles `/api/health`, `/api/info`, and `/api/predict`. No external backend URL or CORS configuration is needed.

## Existing deployment

- Live app: https://tomato-leaf-disease-sigma.vercel.app
- Dashboard: https://vercel.com/himelkabirs-projects/tomato-leaf-disease
- Plan: Hobby
- Repository: `himelKabir/tomato-leaf-disease`; production branch: `main`

The repository is connected to Vercel for automatic deployment. Update the app, commit your changes, and push to `main` to publish them. The project settings below are already configured for this deployment. Vercel's local `.vercel/` metadata and `.env.local` credentials are ignored by Git.

## Deploy from GitHub into another account

1. Commit and push the Vercel files from the repository root.
2. Sign in at https://vercel.com with GitHub and choose **Add New -> Project**.
3. Import `himelKabir/tomato-leaf-disease` and select your personal **Hobby** account for a free personal project.
4. Set **Root Directory** to `app` and **Framework Preset** to **FastAPI**.
5. Keep **Node.js Version** at **22.x**. The Python version is declared in `.python-version`.
6. The Build Command is `node build-frontend.mjs` (also specified in `vercel.json`). Keep the Output Directory unset/default; this is a FastAPI deployment, and Vercel publishes the generated `public/` files itself.
7. Add environment variable `VERCEL_SUPPORT_LARGE_FUNCTIONS` = `1` for Production and Preview. Keep **Fluid compute** and **Active CPU** enabled so the PyTorch bundle can use Large Functions.
8. Click **Deploy**. Watch the build logs, then test the generated `https://...vercel.app` URL.

Do not select only `app/frontend` as the project root: that would deploy the page without the prediction API. Vercel uses the native Python runtime here; the Dockerfile remains for Docker hosts.

## Check the deployed app

- `/api/health` should return `{"status":"ok"}`.
- `/api/info` should report `trained: true`, `load_error: null`, and `model_file: "app/models/model.pt"` or an equivalent path relative to the deployed project.
- Upload a disease photo and verify predictions and the heatmap.
- Open `/about` and `/diseases` directly and refresh them to check React routing.
- `/api/does-not-exist` should return an API 404, not the frontend HTML.

The included checkpoint is the existing working app's real-only MobileNetV2 export. Deploying does not replace it with the later notebook-05 export.

## Free-plan limits relevant to this model

Vercel's standard Python bundle limit is 500 MB uncompressed. The Large Functions public beta raises the bundle limit to 5 GB with eligible Fluid/Active CPU settings. This project explicitly installs CPU-only PyTorch through uv to avoid CUDA dependencies. If a build fails at the standard size limit, check that the environment variable and compute settings above are enabled, then redeploy.

Hobby functions have 2 GB memory and a maximum duration of 300 seconds. A cold start can take longer while PyTorch loads. Upload requests are limited to 4.5 MB by Vercel; the frontend normally resizes photos before upload, but use a smaller JPEG if a browser cannot resize a particular image. Free usage is subject to Hobby quotas and personal/non-commercial eligibility.

References:

- https://vercel.com/docs/frameworks/backend/fastapi
- https://vercel.com/docs/functions/limitations
- https://vercel.com/docs/plans/hobby
- https://docs.astral.sh/uv/guides/integration/pytorch/
