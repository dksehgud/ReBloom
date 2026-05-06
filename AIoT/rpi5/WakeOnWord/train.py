#!/usr/bin/env python3
"""
train.py — "hi blooming" 커스텀 웨이크워드 모델 학습
=====================================================

generate_samples.py로 생성된 샘플을 사용해
openWakeWord 호환 경량 모델을 학습하고 ONNX로 저장합니다.

출력:
    models/hi_blooming.onnx   — 추론용 모델 (LLM/wake_openwakeword.py 호환)
    logs/training.log         — 학습 로그

사용법:
    python train.py                          # 기본 학습
    python train.py --epochs 30              # 에폭 수 지정
    python train.py --batch-size 64          # 배치 크기
    python train.py --val-split 0.15         # 검증 세트 비율
    python train.py --no-augment             # 증강 샘플 미사용
    python train.py --eval-only              # 학습 없이 평가만
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import random
import sys
import time
from pathlib import Path

import numpy as np

# ── 경로 설정 ─────────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / "data"
POSITIVE_DIR = DATA_DIR / "positive"
AUGMENTED_DIR = DATA_DIR / "augmented"
NEGATIVE_DIR = DATA_DIR / "negative"
RECORDED_DIR = DATA_DIR / "recorded"
MODELS_DIR = SCRIPT_DIR / "models"
LOGS_DIR = SCRIPT_DIR / "logs"
OUTPUT_MODEL = MODELS_DIR / "hi_blooming.onnx"

TARGET_SR = 16_000
FRAME_MS = 80                              # openWakeWord 기본 프레임 크기
FRAME_SAMPLES = int(TARGET_SR * FRAME_MS / 1000)   # 1280 샘플
N_FRAMES = 16                             # 입력 프레임 수 (임베딩 시퀀스)

# ── 로깅 설정 ─────────────────────────────────────────────────────────────────
LOGS_DIR.mkdir(parents=True, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOGS_DIR / "training.log", encoding="utf-8"),
    ],
)
log = logging.getLogger(__name__)


# ── 오디오 → 임베딩 ───────────────────────────────────────────────────────────

def load_audio(path: Path, target_sr: int = TARGET_SR) -> np.ndarray | None:
    """WAV 파일 로드 → float32 mono."""
    try:
        import soundfile as sf
        from scipy.signal import resample_poly
        audio, sr = sf.read(str(path), dtype="float32")
        if audio.ndim > 1:
            audio = audio.mean(axis=1)
        if sr != target_sr:
            audio = resample_poly(audio, target_sr, sr).astype(np.float32)
        return audio
    except Exception as exc:
        log.warning("파일 로드 실패 %s: %s", path, exc)
        return None


def get_openwakeword_embeddings(audio: np.ndarray) -> np.ndarray | None:
    """
    openWakeWord 내장 오디오 임베딩 추출.
    Google Speech Embedding 모델을 사용해 80ms 프레임별 임베딩을 반환합니다.
    """
    try:
        import contextlib
        import io
        import warnings

        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            with contextlib.redirect_stderr(io.StringIO()):
                from openwakeword.utils import AudioFeatures

        af = AudioFeatures()
        # 16-bit int 변환 (openWakeWord 입력 포맷)
        audio_int16 = np.clip(audio, -1.0, 1.0)
        audio_int16 = (audio_int16 * 32767).astype(np.int16)

        embeddings = []
        for start in range(0, len(audio_int16) - FRAME_SAMPLES + 1, FRAME_SAMPLES):
            frame = audio_int16[start:start + FRAME_SAMPLES]
            emb = af.embed_model.predict(frame)
            if emb is not None:
                embeddings.append(emb.flatten())

        if not embeddings:
            return None
        return np.array(embeddings, dtype=np.float32)

    except Exception as exc:
        log.debug("임베딩 추출 실패: %s", exc)
        return None


def audio_to_feature(audio: np.ndarray, n_frames: int = N_FRAMES) -> np.ndarray | None:
    """오디오 → 고정 크기 특징 벡터 (n_frames, embedding_dim)."""
    embeddings = get_openwakeword_embeddings(audio)
    if embeddings is None or len(embeddings) == 0:
        # fallback: 간단한 MFCC 기반 특징
        return audio_to_mfcc_feature(audio, n_frames)

    # n_frames 크기로 조정
    if len(embeddings) >= n_frames:
        return embeddings[:n_frames]
    # 패딩
    pad = np.zeros((n_frames - len(embeddings), embeddings.shape[1]), dtype=np.float32)
    return np.vstack([embeddings, pad])


def audio_to_mfcc_feature(audio: np.ndarray, n_frames: int = N_FRAMES) -> np.ndarray | None:
    """Fallback: 간단한 멜 스펙트로그램 특징 (librosa)."""
    try:
        import librosa
        mel = librosa.feature.melspectrogram(
            y=audio, sr=TARGET_SR, n_mels=40, hop_length=FRAME_SAMPLES
        )
        mel_db = librosa.power_to_db(mel, ref=np.max)
        # (40, T) → (T, 40)
        mel_db = mel_db.T.astype(np.float32)
        if len(mel_db) >= n_frames:
            return mel_db[:n_frames]
        pad = np.zeros((n_frames - len(mel_db), mel_db.shape[1]), dtype=np.float32)
        return np.vstack([mel_db, pad])
    except Exception as exc:
        log.warning("MFCC 추출 실패: %s", exc)
        return None


# ── 데이터셋 준비 ─────────────────────────────────────────────────────────────

def load_dataset(use_augmented: bool = True) -> tuple[np.ndarray, np.ndarray]:
    """positive/negative 샘플 로드 → 특징 행렬, 레이블."""
    X, y = [], []

    # Positive 샘플 (레이블 1)
    pos_sources = [POSITIVE_DIR]
    if use_augmented and AUGMENTED_DIR.exists():
        pos_sources.append(AUGMENTED_DIR)
    if RECORDED_DIR.exists():
        pos_sources.append(RECORDED_DIR)

    pos_files = []
    for src in pos_sources:
        pos_files.extend(list(src.glob("*.wav")))
    log.info("positive 파일: %d개", len(pos_files))

    for wav_path in pos_files:
        audio = load_audio(wav_path)
        if audio is None:
            continue
        feat = audio_to_feature(audio)
        if feat is None:
            continue
        X.append(feat)
        y.append(1)

    # Negative 샘플 (레이블 0)
    neg_files = list(NEGATIVE_DIR.glob("*.wav"))
    log.info("negative 파일: %d개", len(neg_files))

    # 클래스 균형: negative를 positive의 2배 이하로 제한
    max_neg = len(pos_files) * 2
    if len(neg_files) > max_neg:
        neg_files = random.sample(neg_files, max_neg)

    for wav_path in neg_files:
        audio = load_audio(wav_path)
        if audio is None:
            continue
        feat = audio_to_feature(audio)
        if feat is None:
            continue
        X.append(feat)
        y.append(0)

    if not X:
        raise ValueError(
            "학습 데이터가 없습니다. "
            "먼저 `python WakeOnWord/generate_samples.py`를 실행하세요."
        )

    X_arr = np.array(X, dtype=np.float32)
    y_arr = np.array(y, dtype=np.int64)
    log.info("데이터셋: %d개 (positive=%d, negative=%d)",
             len(y_arr), (y_arr == 1).sum(), (y_arr == 0).sum())
    return X_arr, y_arr


# ── 모델 정의 ─────────────────────────────────────────────────────────────────

def build_model(input_shape: tuple[int, int]) -> "torch.nn.Module":
    """경량 LSTM 분류 모델."""
    import torch
    import torch.nn as nn

    n_frames, feat_dim = input_shape

    class WakeWordModel(nn.Module):
        def __init__(self) -> None:
            super().__init__()
            self.lstm = nn.LSTM(
                input_size=feat_dim,
                hidden_size=64,
                num_layers=2,
                batch_first=True,
                dropout=0.3,
            )
            self.norm = nn.LayerNorm(64)
            self.fc = nn.Sequential(
                nn.Linear(64, 32),
                nn.ReLU(),
                nn.Dropout(0.3),
                nn.Linear(32, 1),
                nn.Sigmoid(),
            )

        def forward(self, x: "torch.Tensor") -> "torch.Tensor":
            # x: (batch, n_frames, feat_dim)
            out, _ = self.lstm(x)
            out = self.norm(out[:, -1, :])   # 마지막 타임스텝
            return self.fc(out).squeeze(-1)

    return WakeWordModel()


# ── 학습 루프 ─────────────────────────────────────────────────────────────────

def train(args: argparse.Namespace) -> None:
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader, TensorDataset, random_split

    log.info("학습 시작: hi_blooming 웨이크워드 모델")
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    # 데이터 로드
    X, y = load_dataset(use_augmented=not args.no_augment)
    n_samples, n_frames, feat_dim = X.shape
    log.info("입력 형태: (%d frames, %d features)", n_frames, feat_dim)

    # Tensor 변환
    X_tensor = torch.tensor(X, dtype=torch.float32)
    y_tensor = torch.tensor(y, dtype=torch.float32)
    dataset = TensorDataset(X_tensor, y_tensor)

    # Train/Val 분리
    val_size = max(1, int(n_samples * args.val_split))
    train_size = n_samples - val_size
    train_ds, val_ds = random_split(dataset, [train_size, val_size])

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False)
    log.info("학습: %d개, 검증: %d개", train_size, val_size)

    # 모델, 옵티마이저
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    log.info("디바이스: %s", device)
    model = build_model((n_frames, feat_dim)).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=args.lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, patience=5, factor=0.5
    )
    criterion = nn.BCELoss()

    # 클래스 가중치 (불균형 보정)
    pos_weight = (y == 0).sum() / max((y == 1).sum(), 1)
    log.info("positive 가중치: %.2f", pos_weight)
    criterion = nn.BCELoss(
        weight=None  # 단순화; 복잡한 경우 pos_weight 활용
    )

    best_val_f1 = 0.0
    best_epoch = 0

    for epoch in range(1, args.epochs + 1):
        # 학습
        model.train()
        train_loss = 0.0
        for X_batch, y_batch in train_loader:
            X_batch, y_batch = X_batch.to(device), y_batch.to(device)
            optimizer.zero_grad()
            preds = model(X_batch)
            loss = criterion(preds, y_batch)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            train_loss += loss.item()

        train_loss /= len(train_loader)

        # 검증
        model.eval()
        val_loss = 0.0
        all_preds, all_labels = [], []
        with torch.no_grad():
            for X_batch, y_batch in val_loader:
                X_batch, y_batch = X_batch.to(device), y_batch.to(device)
                preds = model(X_batch)
                loss = criterion(preds, y_batch)
                val_loss += loss.item()
                all_preds.extend(preds.cpu().numpy())
                all_labels.extend(y_batch.cpu().numpy())

        val_loss /= len(val_loader)
        scheduler.step(val_loss)

        # F1 계산
        preds_bin = np.array(all_preds) >= 0.5
        labels = np.array(all_labels)
        tp = ((preds_bin == 1) & (labels == 1)).sum()
        fp = ((preds_bin == 1) & (labels == 0)).sum()
        fn = ((preds_bin == 0) & (labels == 1)).sum()
        precision = tp / max(tp + fp, 1)
        recall = tp / max(tp + fn, 1)
        f1 = 2 * precision * recall / max(precision + recall, 1e-8)
        acc = (preds_bin == labels).mean()

        log.info(
            "[Epoch %3d/%3d] loss=%.4f val_loss=%.4f acc=%.3f P=%.3f R=%.3f F1=%.3f",
            epoch, args.epochs, train_loss, val_loss, acc, precision, recall, f1,
        )

        # 최고 모델 저장
        if f1 > best_val_f1:
            best_val_f1 = f1
            best_epoch = epoch
            torch.save(model.state_dict(), MODELS_DIR / "hi_blooming_best.pt")
            log.info("  ★ 최고 모델 저장 (F1=%.3f)", f1)

    log.info("학습 완료. 최고 F1=%.3f (Epoch %d)", best_val_f1, best_epoch)

    # 최고 모델 로드 후 ONNX 내보내기
    model.load_state_dict(torch.load(MODELS_DIR / "hi_blooming_best.pt", map_location=device))
    model.eval()

    export_onnx(model, n_frames, feat_dim, device)


def export_onnx(
    model: "torch.nn.Module",
    n_frames: int,
    feat_dim: int,
    device: "torch.device",
) -> None:
    """PyTorch 모델 → ONNX 저장."""
    import torch

    dummy_input = torch.randn(1, n_frames, feat_dim, device=device)
    log.info("ONNX 내보내기: %s", OUTPUT_MODEL)

    # PyTorch 2.5+에서 기본값이 dynamo(새 엔진)로 바뀌어 onnxscript가 필요함.
    # dynamo=False 로 구 TorchScript 기반 exporter 강제 사용.
    _export_kwargs = dict(
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={
            "input": {0: "batch"},
            "output": {0: "batch"},
        },
        opset_version=14,
        do_constant_folding=True,
    )
    try:
        # torch >= 2.5: dynamo 파라미터 지원
        torch.onnx.export(model, dummy_input, str(OUTPUT_MODEL), dynamo=False, **_export_kwargs)
    except TypeError:
        # torch < 2.5: dynamo 파라미터 없음, 기본값이 이미 TorchScript 방식
        torch.onnx.export(model, dummy_input, str(OUTPUT_MODEL), **_export_kwargs)

    # 메타데이터 저장
    meta = {
        "wake_word": "hi blooming",
        "n_frames": n_frames,
        "feat_dim": feat_dim,
        "sample_rate": TARGET_SR,
        "frame_ms": FRAME_MS,
        "model_type": "lstm_classifier",
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
    }
    meta_path = MODELS_DIR / "hi_blooming_meta.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    log.info("ONNX 저장 완료: %s", OUTPUT_MODEL)
    log.info("메타데이터: %s", meta_path)
    log.info("")
    log.info("통합 사용법:")
    log.info(
        "  REBLOOM_OPENWAKEWORD_MODELS=%s \\", OUTPUT_MODEL
    )
    log.info("    python LLM/wake_openwakeword.py --debug")


# ── 평가 전용 ─────────────────────────────────────────────────────────────────

def evaluate_only() -> None:
    """학습 없이 기존 모델로 검증 세트 평가."""
    if not OUTPUT_MODEL.exists():
        log.error("모델 파일이 없습니다: %s", OUTPUT_MODEL)
        sys.exit(1)

    import onnxruntime as ort

    log.info("평가 전용 모드: %s", OUTPUT_MODEL)
    session = ort.InferenceSession(str(OUTPUT_MODEL))
    input_name = session.get_inputs()[0].name

    X, y = load_dataset()
    correct = total = 0

    for feat, label in zip(X, y):
        feat_in = feat[np.newaxis].astype(np.float32)
        score = session.run(None, {input_name: feat_in})[0][0]
        pred = int(score >= 0.5)
        if pred == label:
            correct += 1
        total += 1

    log.info("평가 결과: %d/%d (%.1f%%)", correct, total, 100 * correct / max(total, 1))


# ── 메인 ──────────────────────────────────────────────────────────────────────

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="hi blooming 웨이크워드 LSTM 모델 학습"
    )
    parser.add_argument("--epochs", type=int, default=50, help="학습 에폭 수 (기본: 50)")
    parser.add_argument("--batch-size", type=int, default=32, help="배치 크기 (기본: 32)")
    parser.add_argument("--lr", type=float, default=1e-3, help="학습률 (기본: 0.001)")
    parser.add_argument("--val-split", type=float, default=0.15, help="검증 비율 (기본: 0.15)")
    parser.add_argument("--no-augment", action="store_true", help="증강 샘플 미사용")
    parser.add_argument("--eval-only", action="store_true", help="학습 없이 평가만")
    return parser


def main() -> None:
    args = build_parser().parse_args()

    if args.eval_only:
        evaluate_only()
        return

    try:
        import torch  # noqa: F401
    except ImportError:
        log.error("PyTorch 미설치. `pip install torch`로 설치 후 다시 실행하세요.")
        sys.exit(1)

    train(args)


if __name__ == "__main__":
    main()
