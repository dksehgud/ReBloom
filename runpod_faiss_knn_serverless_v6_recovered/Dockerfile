FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    MODEL_DIR=/workspace/output/faiss_openai_large \
    KEYWORD_MODEL_DIR=/workspace/output/faiss_keywords \
    NO_GPU=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY app/requirements.runpod.txt /app/requirements.runpod.txt
RUN python3 -m pip install --upgrade pip \
    && python3 -m pip install -r /app/requirements.runpod.txt

COPY app/ /app/
COPY local_test.py /app/local_test.py
COPY test_input_long_ko.txt /app/test_input_long_ko.txt
COPY workspace_output/faiss_openai_large/ /workspace/output/faiss_openai_large/
COPY workspace_output/faiss_keywords/ /workspace/output/faiss_keywords/

RUN sed -i 's/\r$//' /app/runpod/*.sh \
    && chmod +x /app/runpod/*.sh

CMD ["python3", "/app/runpod_handler.py"]
