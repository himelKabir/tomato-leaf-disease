# The web app as one container, for Hugging Face Spaces (Docker SDK) or any Docker host.
# Build context: this app/ folder.   docker build -t tomato-leaf .   docker run -p 7860:7860 tomato-leaf

# 1. Build the React page
FROM node:22-slim AS frontend
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# 2. The Python server (CPU-only PyTorch: much smaller than the GPU build)
FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
RUN pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install -r /tmp/requirements.txt

# Spaces runs the container as user 1000
RUN useradd -m -u 1000 user
WORKDIR /home/user/app
COPY --chown=user backend/ backend/
COPY --chown=user models/ models/
COPY --from=frontend --chown=user /build/dist frontend/dist
USER user

WORKDIR /home/user/app/backend
EXPOSE 7860
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
