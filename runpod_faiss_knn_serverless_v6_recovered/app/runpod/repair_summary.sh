#!/usr/bin/env bash
set -euo pipefail

INPUT_PATH="${INPUT_PATH:-/workspace/data/Depression_Severity_Levels_Dataset_clean_translategemma_ko_summary.csv}"
OUTPUT_PATH="${OUTPUT_PATH:-/workspace/data/Depression_Severity_Levels_Dataset_clean_translategemma_ko_summary_source_id.csv}"
CHECKPOINT_PATH="${CHECKPOINT_PATH:-/workspace/output/repair_summary_with_source_id_checkpoint.csv}"
MODEL="${MODEL:-google/translategemma-12b-it}"
SOURCE_ID_COL="${SOURCE_ID_COL:-source_id}"
SOURCE_ID_PREFIX="${SOURCE_ID_PREFIX:-dsl}"
START_ID="${START_ID:-1}"
MAX_CHARS="${MAX_CHARS:-1200}"
FINAL_MAX_CHARS="${FINAL_MAX_CHARS:-2400}"
MAX_NEW_TOKENS="${MAX_NEW_TOKENS:-192}"
FINAL_MAX_NEW_TOKENS="${FINAL_MAX_NEW_TOKENS:-224}"
DEVICE="${DEVICE:-cuda}"
GPU_ID="${GPU_ID:-0}"
GPU_IDS="${GPU_IDS:-}"
NUM_GPUS="${NUM_GPUS:-1}"
BATCH_SIZE="${BATCH_SIZE:-1}"
TORCH_DTYPE="${TORCH_DTYPE:-bfloat16}"
SAVE_EVERY="${SAVE_EVERY:-25}"

mkdir -p "$(dirname "$OUTPUT_PATH")" "$(dirname "$CHECKPOINT_PATH")" /workspace/.cache

GPU_IDS_ARGS=()
if [ -n "$GPU_IDS" ]; then
  GPU_IDS_ARGS=(--gpu-ids "$GPU_IDS")
fi

python3 /app/repair_summary_with_source_id.py \
  --input "$INPUT_PATH" \
  --output "$OUTPUT_PATH" \
  --checkpoint "$CHECKPOINT_PATH" \
  --model "$MODEL" \
  --source-id-col "$SOURCE_ID_COL" \
  --source-id-prefix "$SOURCE_ID_PREFIX" \
  --start-id "$START_ID" \
  --max-chars "$MAX_CHARS" \
  --final-max-chars "$FINAL_MAX_CHARS" \
  --max-new-tokens "$MAX_NEW_TOKENS" \
  --final-max-new-tokens "$FINAL_MAX_NEW_TOKENS" \
  --device "$DEVICE" \
  --gpu-id "$GPU_ID" \
  "${GPU_IDS_ARGS[@]}" \
  --num-gpus "$NUM_GPUS" \
  --batch-size "$BATCH_SIZE" \
  --torch-dtype "$TORCH_DTYPE" \
  --save-every "$SAVE_EVERY"
