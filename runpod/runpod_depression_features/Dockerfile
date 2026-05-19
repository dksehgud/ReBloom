FROM nvidia/cuda:12.4.1-cudnn-devel-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/workspace/.cache/huggingface \
    TRANSFORMERS_CACHE=/workspace/.cache/huggingface \
    TORCH_HOME=/workspace/.cache/torch \
    USE_FAISS=0

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        python3 \
        python3-pip \
    && rm -rf /var/lib/apt/lists/*

COPY runpod_depression_features/requirements.txt /app/requirements.txt

RUN python3 -m pip install --upgrade pip \
    && python3 -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124 \
    && python3 -m pip install -r /app/requirements.txt

COPY runpod_depression_features/handler.py /app/handler.py
COPY faiss_knn_classifier.py /app/faiss_knn_classifier.py
COPY faiss_keywords /workspace/output/faiss_keywords

CMD ["python3", "/app/handler.py"]
