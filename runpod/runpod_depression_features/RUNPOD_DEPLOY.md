# RunPod Combined Analysis Endpoint

This directory contains a RunPod serverless endpoint that combines:

1. FAISS embedding text generation and keyword matching.
2. TranslateGemma Korean-to-English translation.
3. DepRoBERTa raw depression logits.
4. GMS/LLM scoring for the eight extra SVR features.

The final `logits` field is the 11-value vector in the same order used by `SVR/`:

```text
not_depressed_logit
moderately_depressed_logit
severely_depressed_logit
suicidal_thought
anhedonia
concentration_problem
mood_change
financial_problem
social_withdrawal
sleep_problem
wellbeing
```

## Build

Build from the repository root. The Dockerfile needs the root context so it can copy `faiss_knn_classifier.py`, `faiss_openai_large/`, and `faiss_keywords/` into the image.

```bash
docker build -f runpod_depression_features/Dockerfile -t depression-features-runpod .
```

Push to your registry:

```bash
docker tag depression-features-runpod <your-registry>/depression-features-runpod:latest
docker push <your-registry>/depression-features-runpod:latest
```

The container command is:

```bash
python3 /app/handler.py
```

## Input

Diary:

```json
{
  "input": {
    "text": "오늘은 기분이 별로였고 잠을 잘 못 잤다..."
  }
}
```

Conversation, joined before sending:

```json
{
  "input": {
    "text": "User: 안녕\nBot: 안녕, 오늘은 어땠어?\nUser: 별로였어"
  }
}
```

Optional fields inside `input`:

```json
{
  "input": {
    "text": "I cannot sleep well lately.",
    "source_lang": "en",
    "target_lang": "en",
    "skip_translation": true,
    "target_date": "2026-05-18",
    "include_debug": true
  }
}
```

Batch:

```json
{
  "input": {
    "texts": [
      "오늘은 기분이 별로였고 잠을 잘 못 잤다...",
      "User: 안녕\nBot: 안녕, 오늘은 어땠어?\nUser: 별로였어"
    ]
  }
}
```

## Output

Single input returns:

```json
{
  "embedding_text": "분석/요약 텍스트",
  "keywords": ["수면", "불안", "우울"],
  "logits": [0.12, 0.03, 0.41, 0.8, 0.2, 0.5, 0.11, 0.7, 0.33, 0.9, 0.4],
  "target_date": "2026-05-18"
}
```

When `include_debug` is true, the response also includes `features`, `feature_order`, `feature_vector`, `translated_english`, and `deproberta_raw_logits`.

## Environment Variables

```text
MODEL_DIR=/workspace/output/faiss_openai_large
KEYWORD_MODEL_DIR=/workspace/output/faiss_keywords
USE_FAISS=1
NO_GPU=1
EMBEDDING_API_URL=https://gms.ssafy.io/gmsapi/api.openai.com/v1/embeddings
EMBEDDING_API_KEY=
EMBEDDING_MODEL=text-embedding-3-large
# The bundled FAISS indexes were built with text-embedding-3-large at 3072 dimensions.
# Default is Authorization: Bearer <key>. Use x-api-key if your gateway requires it.
EMBEDDING_API_KEY_HEADER=Authorization
EMBEDDING_TIMEOUT=120
SUMMARIZE_INPUT=1
SUMMARY_API_URL=https://gms.ssafy.io/gmsapi/api.openai.com/v1/chat/completions
SUMMARY_API_KEY=
SUMMARY_MODEL=gpt-4o-mini
SUMMARY_MAX_CHARS=2500
SUMMARY_MAX_TOKENS=512
TRANSLATION_MODEL=google/translategemma-12b-it
DEPRESSION_MODEL=rafalposwiata/deproberta-large-depression
HF_TOKEN=
HF_HOME=/workspace/.cache/huggingface
DEVICE=cuda
GPU_ID=0
TORCH_DTYPE=bfloat16
SOURCE_LANG=ko
TARGET_LANG=en
MAX_INPUT_CHARS=4000
SKIP_TRANSLATION=0
MAX_TRANSLATION_TOKENS=512
MAX_GMS_TOKENS=512
GMS_API_URL=https://gms.ssafy.io/gmsapi/api.openai.com/v1/chat/completions
GMS_API_KEY=
GMS_MODEL=gpt-5-mini
GMS_TIMEOUT=120
MAX_RETRIES=2
DEPRESSION_MAX_LENGTH=512
```

The same API key can be shared by summary, embedding, and GMS calls. In that case set only `GMS_API_KEY` plus the different POST URLs:

```text
EMBEDDING_API_URL=https://gms.ssafy.io/gmsapi/api.openai.com/v1/embeddings
EMBEDDING_MODEL=text-embedding-3-large
SUMMARY_API_URL=https://gms.ssafy.io/gmsapi/api.openai.com/v1/chat/completions
SUMMARY_MODEL=gpt-4o-mini
GMS_API_URL=https://gms.ssafy.io/gmsapi/api.openai.com/v1/chat/completions
GMS_MODEL=gpt-5-mini
GMS_API_KEY=...
```

`EMBEDDING_API_KEY` and `SUMMARY_API_KEY` are optional overrides. If they are empty, the code uses `GMS_API_KEY`.

The FAISS embedding request is sent as a direct POST to the embeddings endpoint, with a body like `{"model":"text-embedding-3-large","input":[...],"encoding_format":"float"}`. If your gateway requires `x-api-key` instead of bearer auth, set `EMBEDDING_API_KEY_HEADER=x-api-key`.

The bundled `faiss_openai_large/` and `faiss_keywords/` indexes expect 3072-dimensional embeddings. Do not use a different embedding model or a reduced-dimension embedding response unless you rebuild both FAISS indexes with the same dimensions.

`SUMMARY_API_KEY` is for the LLM summary that creates `embedding_text`; it is not used by TranslateGemma. TranslateGemma uses the local Hugging Face model and `HF_TOKEN` if needed.

`policy.ttl` is a RunPod job setting, not handler input. You can omit it when calling the endpoint unless you specifically want to control how long RunPod keeps the job alive.
