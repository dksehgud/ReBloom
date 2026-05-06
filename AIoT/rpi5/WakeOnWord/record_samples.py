#!/usr/bin/env python3
"""
record_samples.py — "hi blooming" 실제 발화 녹음 보조 도구
==========================================================

마이크로 직접 "hi blooming"을 발화하고 WAV 파일로 저장합니다.
실제 녹음 샘플을 추가하면 모델 정확도가 크게 향상됩니다.

출력:
    data/recorded/recorded_XXXXXX.wav   — 녹음 파일 (16kHz mono)

사용법:
    python record_samples.py               # 기본 (30회 녹음)
    python record_samples.py --count 50    # 50회 녹음
    python record_samples.py --duration 2  # 2초씩 녹음
    python record_samples.py --device 1    # 마이크 장치 번호 지정
    python record_samples.py --list-devices  # 사용 가능한 마이크 목록
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

import numpy as np

SCRIPT_DIR = Path(__file__).parent
RECORDED_DIR = SCRIPT_DIR / "data" / "recorded"
TARGET_SR = 16_000


def list_audio_devices() -> None:
    """사용 가능한 오디오 입력 장치 목록 출력."""
    try:
        import sounddevice as sd
        devices = sd.query_devices()
        print("\n사용 가능한 오디오 입력 장치:")
        print("─" * 50)
        for i, dev in enumerate(devices):
            if dev["max_input_channels"] > 0:
                print(f"  [{i:2d}] {dev['name']}  (채널: {dev['max_input_channels']})")
        print()
    except ImportError:
        print("sounddevice 미설치. `pip install sounddevice`로 설치하세요.", file=sys.stderr)
        sys.exit(1)


def record_clip(
    duration: float,
    device: int | None,
    sr: int = TARGET_SR,
) -> np.ndarray:
    """마이크에서 duration초 오디오 녹음 → float32 numpy 배열."""
    try:
        import sounddevice as sd
    except ImportError:
        print("sounddevice 미설치. `pip install sounddevice`로 설치하세요.", file=sys.stderr)
        sys.exit(1)

    n_samples = int(sr * duration)
    kwargs = {"samplerate": sr, "channels": 1, "dtype": "float32"}
    if device is not None:
        kwargs["device"] = device

    audio = sd.rec(n_samples, **kwargs)
    sd.wait()
    return audio.flatten()


def save_wav(path: Path, audio: np.ndarray, sr: int = TARGET_SR) -> None:
    """16-bit PCM WAV 저장."""
    import soundfile as sf
    path.parent.mkdir(parents=True, exist_ok=True)
    audio_int16 = np.clip(audio, -1.0, 1.0)
    audio_int16 = (audio_int16 * 32767).astype(np.int16)
    sf.write(str(path), audio_int16, sr, subtype="PCM_16")


def compute_rms(audio: np.ndarray) -> float:
    """RMS 에너지 계산."""
    return float(np.sqrt(np.mean(audio ** 2)))


def record_session(args: argparse.Namespace) -> None:
    """대화형 녹음 세션."""
    RECORDED_DIR.mkdir(parents=True, exist_ok=True)
    existing = len(list(RECORDED_DIR.glob("*.wav")))

    print("━" * 60)
    print(" hi blooming 웨이크워드 녹음 도구")
    print("━" * 60)
    print(f" 목표 녹음 횟수: {args.count}회")
    print(f" 녹음 시간: {args.duration}초/회")
    print(f" 저장 위치: {RECORDED_DIR}")
    if existing > 0:
        print(f" 기존 녹음: {existing}개")
    print()
    print(" 팁:")
    print("  - 다양한 억양으로 발화하세요 (높게, 낮게, 빠르게, 느리게)")
    print("  - 실제 사용 환경(방, 거실 등)에서 녹음하세요")
    print("  - 마이크에서 30~60cm 거리를 유지하세요")
    print()
    print(" Enter: 녹음 시작 / q+Enter: 종료")
    print("━" * 60)

    recorded = 0
    skipped = 0
    idx = existing

    while recorded < args.count:
        remaining = args.count - recorded
        prompt = f"\n[{recorded+1}/{args.count}] Enter를 누르면 {args.duration}초간 녹음합니다"
        if args.count > 1:
            prompt += f" (남은: {remaining}회)"
        prompt += " > "

        try:
            user_in = input(prompt).strip().lower()
        except (KeyboardInterrupt, EOFError):
            break

        if user_in in ("q", "quit", "exit"):
            print("\n녹음 중단.")
            break

        # 카운트다운
        for t in range(min(3, int(args.duration)), 0, -1):
            print(f"  {t}초 후 녹음 시작...", end="\r", flush=True)
            time.sleep(1)
        print(f"  🎙  녹음 중 ({args.duration}초)...   ", flush=True)

        audio = record_clip(args.duration, args.device)

        # 품질 확인
        rms = compute_rms(audio)
        if rms < args.min_rms:
            print(f"  ⚠  너무 조용합니다 (RMS={rms:.4f} < {args.min_rms}). 다시 시도하세요.")
            skipped += 1
            continue

        # 저장
        out_path = RECORDED_DIR / f"recorded_{idx:06d}.wav"
        save_wav(out_path, audio)
        recorded += 1
        idx += 1
        print(f"  ✓  저장: {out_path.name}  (RMS={rms:.4f})")

    print()
    print("━" * 60)
    print(f" 녹음 완료: {recorded}개 저장, {skipped}개 건너뜀")
    print(f" 총 녹음 파일: {len(list(RECORDED_DIR.glob('*.wav')))}개")
    print()
    print(" 다음 단계: python WakeOnWord/train.py")
    print("━" * 60)


# ── 메인 ──────────────────────────────────────────────────────────────────────

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="hi blooming 웨이크워드 녹음 도구"
    )
    parser.add_argument("--count", type=int, default=30, help="녹음 횟수 (기본: 30)")
    parser.add_argument("--duration", type=float, default=1.5, help="녹음 길이 초 (기본: 1.5)")
    parser.add_argument("--device", type=int, default=None, help="마이크 장치 번호 (기본: 시스템 기본값)")
    parser.add_argument("--min-rms", type=float, default=0.005, help="최소 RMS 에너지 (기본: 0.005)")
    parser.add_argument("--list-devices", action="store_true", help="오디오 장치 목록 출력 후 종료")
    return parser


def main() -> None:
    args = build_parser().parse_args()
    if args.list_devices:
        list_audio_devices()
        return
    record_session(args)


if __name__ == "__main__":
    main()
