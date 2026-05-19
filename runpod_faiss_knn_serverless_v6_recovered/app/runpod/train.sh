#!/usr/bin/env bash
set -euo pipefail

CSV_PATH="${CSV_PATH:-/workspace/data/Depression_Severity_Levels_Dataset_clean_translategemma_ko_summary.csv}"
TEXT_COL="${TEXT_COL:-summary}"
LABEL_COL="${LABEL_COL:-label}"
ID_COL="${ID_COL:-source_id}"
OUT_DIR="${OUT_DIR:-/workspace/output/faiss_knn_model}"
REPORT_PATH="${REPORT_PATH:-/workspace/output/eval_report.txt}"
EMBEDDING_MODEL="${EMBEDDING_MODEL:-Qwen/Qwen3-Embedding-0.6B}"
K="${K:-5}"
THRESHOLD="${THRESHOLD:-0.35}"
VOTING="${VOTING:-weighted}"
BATCH_SIZE="${BATCH_SIZE:-32}"
TEST_SIZE="${TEST_SIZE:-0.2}"
GPU_FLAG="${GPU_FLAG:-}"

mkdir -p "$(dirname "$REPORT_PATH")" "$OUT_DIR" /workspace/.cache

python3 /app/faiss_knn_classifier.py train \
  --csv "$CSV_PATH" \
  --text-col "$TEXT_COL" \
  --label-col "$LABEL_COL" \
  --id-col "$ID_COL" \
  --out-dir "$OUT_DIR" \
  --report-path "$REPORT_PATH" \
  --embedding-model "$EMBEDDING_MODEL" \
  --k "$K" \
  --threshold "$THRESHOLD" \
  --voting "$VOTING" \
  --batch-size "$BATCH_SIZE" \
  --test-size "$TEST_SIZE" \
  $GPU_FLAG
