#!/usr/bin/env python3
"""
generate_samples.py — "hi blooming" 합성 학습 샘플 생성기
==========================================================

TTS 엔진(piper-tts / gTTS)을 사용해 "hi blooming" 웨이크워드의
합성 오디오 샘플을 대량 생성합니다.

출력 디렉토리:
    data/positive/   — "hi blooming" 발화 샘플 (WAV, 16kHz mono)
    data/negative/   — 비-웨이크워드 샘플 (Common Voice 등)
    data/augmented/  — 노이즈 믹싱된 증강 샘플

사용법:
    python generate_samples.py                     # 기본 (합성만)
    python generate_samples.py --count 3000        # 목표 샘플 수 지정
    python generate_samples.py --tts gtts          # gTTS만 사용
    python generate_samples.py --tts piper         # piper-tts만 사용
    python generate_samples.py --tts both          # 둘 다 (기본)
    python generate_samples.py --skip-negative     # negative 샘플 생략
    python generate_samples.py --augment-only      # 증강만 재실행
"""

from __future__ import annotations

import argparse
import io
import os
import random
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request
import zipfile
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly
from tqdm import tqdm

# ── 상수 ──────────────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / "data"
POSITIVE_DIR = DATA_DIR / "positive"
NEGATIVE_DIR = DATA_DIR / "negative"
AUGMENTED_DIR = DATA_DIR / "augmented"

TARGET_SR = 16_000          # openWakeWord 요구 샘플레이트
TARGET_DURATION = 1.5       # 초 (패딩/트리밍 기준)
TARGET_SAMPLES = int(TARGET_SR * TARGET_DURATION)

# 웨이크워드 변형 텍스트 (발음 다양성 확보)
WAKE_WORD_VARIANTS = [
    "hi blooming",
    "hi, blooming",
    "hey blooming",
    "hi blooming!",
    "hi blooming?",
]

# piper-tts 다화자 모델 URL 목록 (영어, 다양한 화자)
PIPER_MODELS = [
    {
        "name": "en_US-lessac-medium",
        "url": "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx",
        "config_url": "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json",
    },
    {
        "name": "en_US-amy-medium",
        "url": "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/amy/medium/en_US-amy-medium.onnx",
        "config_url": "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/amy/medium/en_US-amy-medium.onnx.json",
    },
    {
        "name": "en_GB-alan-medium",
        "url": "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_GB/alan/medium/en_GB-alan-medium.onnx",
        "config_url": "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_GB/alan/medium/en_GB-alan-medium.onnx.json",
    },
    {
        "name": "en_US-ryan-medium",
        "url": "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/ryan/medium/en_US-ryan-medium.onnx",
        "config_url": "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/ryan/medium/en_US-ryan-medium.onnx.json",
    },
]

# ── 오디오 유틸 ───────────────────────────────────────────────────────────────

def resample(audio: np.ndarray, orig_sr: int, target_sr: int) -> np.ndarray:
    """샘플레이트 변환."""
    if orig_sr == target_sr:
        return audio
    return resample_poly(audio, target_sr, orig_sr).astype(np.float32)


def normalize(audio: np.ndarray, peak: float = 0.9) -> np.ndarray:
    """피크 정규화."""
    m = np.max(np.abs(audio))
    if m < 1e-6:
        return audio
    return audio * (peak / m)


def pad_or_trim(audio: np.ndarray, n_samples: int) -> np.ndarray:
    """목표 길이로 패딩 또는 트리밍."""
    if len(audio) >= n_samples:
        return audio[:n_samples]
    pad = np.zeros(n_samples - len(audio), dtype=np.float32)
    return np.concatenate([audio, pad])


def save_wav(path: Path, audio: np.ndarray, sr: int = TARGET_SR) -> None:
    """16-bit PCM WAV 저장."""
    path.parent.mkdir(parents=True, exist_ok=True)
    audio_int16 = np.clip(audio, -1.0, 1.0)
    audio_int16 = (audio_int16 * 32767).astype(np.int16)
    sf.write(str(path), audio_int16, sr, subtype="PCM_16")


def load_wav(path: Path, target_sr: int = TARGET_SR) -> np.ndarray:
    """WAV 로드 → float32 mono, target_sr."""
    audio, sr = sf.read(str(path), dtype="float32")
    if audio.ndim > 1:
        audio = audio.mean(axis=1)
    if sr != target_sr:
        audio = resample(audio, sr, target_sr)
    return audio.astype(np.float32)


# ── 노이즈 증강 ───────────────────────────────────────────────────────────────

def add_noise(audio: np.ndarray, snr_db: float) -> np.ndarray:
    """가우시안 화이트 노이즈 추가 (SNR dB 기준)."""
    signal_power = np.mean(audio ** 2)
    if signal_power < 1e-10:
        return audio
    noise_power = signal_power / (10 ** (snr_db / 10))
    noise = np.random.randn(len(audio)).astype(np.float32) * np.sqrt(noise_power)
    return np.clip(audio + noise, -1.0, 1.0)


def pitch_shift_simple(audio: np.ndarray, semitones: float, sr: int = TARGET_SR) -> np.ndarray:
    """간단한 피치 시프트 (resample 기반)."""
    factor = 2 ** (semitones / 12.0)
    resampled = resample_poly(audio, int(round(TARGET_SR)), int(round(TARGET_SR * factor)))
    return pad_or_trim(resampled.astype(np.float32), len(audio))


def time_stretch(audio: np.ndarray, rate: float) -> np.ndarray:
    """간단한 시간 스트레치 (리샘플링 기반)."""
    n_out = int(len(audio) / rate)
    stretched = resample_poly(audio, n_out, len(audio))
    return stretched.astype(np.float32)


def augment_audio(audio: np.ndarray) -> list[np.ndarray]:
    """하나의 오디오에서 여러 증강 버전 생성."""
    variants = [audio]  # 원본 포함

    # 노이즈 믹싱
    for snr in [5, 10, 15, 20]:
        variants.append(add_noise(audio.copy(), snr))

    # 피치 시프트
    for semitones in [-2, -1, 1, 2]:
        variants.append(pitch_shift_simple(audio.copy(), semitones))

    # 속도 변화
    for rate in [0.85, 0.92, 1.08, 1.15]:
        stretched = time_stretch(audio.copy(), rate)
        variants.append(pad_or_trim(stretched, TARGET_SAMPLES))

    return variants


# ── piper-tts 합성 ────────────────────────────────────────────────────────────

def download_piper_model(model_info: dict, models_dir: Path) -> tuple[Path, Path] | None:
    """piper-tts 모델 파일 다운로드."""
    models_dir.mkdir(parents=True, exist_ok=True)
    name = model_info["name"]
    onnx_path = models_dir / f"{name}.onnx"
    config_path = models_dir / f"{name}.onnx.json"

    if onnx_path.exists() and config_path.exists():
        print(f"  [piper] 기존 모델 사용: {name}")
        return onnx_path, config_path

    print(f"  [piper] 모델 다운로드 중: {name}...")
    try:
        urllib.request.urlretrieve(model_info["url"], str(onnx_path))
        urllib.request.urlretrieve(model_info["config_url"], str(config_path))
        print(f"  [piper] 다운로드 완료: {name}")
        return onnx_path, config_path
    except Exception as exc:
        print(f"  [piper] 다운로드 실패: {name} — {exc}", file=sys.stderr)
        if onnx_path.exists():
            onnx_path.unlink()
        if config_path.exists():
            config_path.unlink()
        return None


def synthesize_with_piper(
    text: str,
    model_path: Path,
    config_path: Path,
    output_path: Path,
) -> bool:
    """piper-tts CLI로 오디오 합성."""
    piper_bin = shutil.which("piper") or shutil.which("piper-tts")
    if not piper_bin:
        # Python 패키지로 시도
        try:
            result = subprocess.run(
                [sys.executable, "-m", "piper",
                 "--model", str(model_path),
                 "--config", str(config_path),
                 "--output_file", str(output_path)],
                input=text.encode(),
                capture_output=True,
                timeout=30,
            )
            return result.returncode == 0
        except Exception:
            return False

    try:
        result = subprocess.run(
            [piper_bin,
             "--model", str(model_path),
             "--config", str(config_path),
             "--output_file", str(output_path)],
            input=text.encode(),
            capture_output=True,
            timeout=30,
        )
        return result.returncode == 0
    except Exception:
        return False


def generate_piper_samples(
    count_per_model: int,
    output_dir: Path,
    piper_models_dir: Path,
) -> int:
    """piper-tts로 positive 샘플 생성."""
    generated = 0

    for model_info in PIPER_MODELS:
        paths = download_piper_model(model_info, piper_models_dir)
        if paths is None:
            continue
        onnx_path, config_path = paths
        model_name = model_info["name"]

        with tempfile.TemporaryDirectory(prefix="piper_gen_") as tmp_dir:
            for i in tqdm(range(count_per_model), desc=f"piper/{model_name}", unit="샘플"):
                text = random.choice(WAKE_WORD_VARIANTS)
                tmp_wav = Path(tmp_dir) / f"tmp_{i}.wav"

                if not synthesize_with_piper(text, onnx_path, config_path, tmp_wav):
                    continue
                if not tmp_wav.exists():
                    continue

                try:
                    audio = load_wav(tmp_wav)
                    audio = normalize(audio)
                    audio = pad_or_trim(audio, TARGET_SAMPLES)
                    out_path = output_dir / f"piper_{model_name}_{i:05d}.wav"
                    save_wav(out_path, audio)
                    generated += 1
                except Exception as exc:
                    print(f"  [piper] 저장 실패: {exc}", file=sys.stderr)

    return generated


# ── gTTS 합성 ─────────────────────────────────────────────────────────────────

def generate_gtts_samples(count: int, output_dir: Path) -> int:
    """gTTS (Google TTS)로 positive 샘플 생성."""
    try:
        from gtts import gTTS
    except ImportError:
        print("[gtts] gTTS 미설치. `pip install gTTS`로 설치하세요.", file=sys.stderr)
        return 0

    generated = 0
    langs_speeds = [
        ("en", False),   # 영어 보통 속도
        ("en", True),    # 영어 느린 속도
    ]

    per_config = max(1, count // len(langs_speeds))
    with tempfile.TemporaryDirectory(prefix="gtts_gen_") as tmp_dir:
        for lang, slow in langs_speeds:
            desc = f"gtts/{lang}/{'slow' if slow else 'normal'}"
            for i in tqdm(range(per_config), desc=desc, unit="샘플"):
                text = random.choice(WAKE_WORD_VARIANTS)
                tmp_mp3 = Path(tmp_dir) / f"tmp_{lang}_{slow}_{i}.mp3"
                tmp_wav = Path(tmp_dir) / f"tmp_{lang}_{slow}_{i}.wav"

                try:
                    tts = gTTS(text=text, lang=lang, slow=slow)
                    tts.save(str(tmp_mp3))
                    # mp3 → wav 변환 (ffmpeg 또는 pydub)
                    if shutil.which("ffmpeg"):
                        subprocess.run(
                            ["ffmpeg", "-y", "-i", str(tmp_mp3),
                             "-ar", str(TARGET_SR), "-ac", "1", str(tmp_wav)],
                            capture_output=True, timeout=15,
                        )
                    else:
                        try:
                            from pydub import AudioSegment
                            seg = AudioSegment.from_mp3(str(tmp_mp3))
                            seg = seg.set_frame_rate(TARGET_SR).set_channels(1)
                            seg.export(str(tmp_wav), format="wav")
                        except ImportError:
                            print("[gtts] ffmpeg 또는 pydub 없음. mp3→wav 변환 불가.", file=sys.stderr)
                            break

                    if not tmp_wav.exists():
                        continue

                    audio = load_wav(tmp_wav)
                    audio = normalize(audio)
                    audio = pad_or_trim(audio, TARGET_SAMPLES)
                    out_path = output_dir / f"gtts_{lang}_{'slow' if slow else 'normal'}_{i:05d}.wav"
                    save_wav(out_path, audio)
                    generated += 1
                    time.sleep(0.3)  # Google TTS rate limit 방지

                except Exception as exc:
                    print(f"  [gtts] 생성 실패: {exc}", file=sys.stderr)
                    time.sleep(1)

    return generated


# ── Negative 샘플 생성 ────────────────────────────────────────────────────────

def generate_silence_noise_negatives(count: int, output_dir: Path) -> int:
    """침묵 + 랜덤 노이즈로 negative 샘플 생성 (오프라인 fallback)."""
    generated = 0
    for i in tqdm(range(count), desc="silence/noise negatives", unit="샘플"):
        noise_type = random.choice(["silence", "white", "pink", "speech_like"])
        if noise_type == "silence":
            audio = np.zeros(TARGET_SAMPLES, dtype=np.float32)
        elif noise_type == "white":
            audio = np.random.randn(TARGET_SAMPLES).astype(np.float32) * 0.05
        elif noise_type == "pink":
            # 핑크 노이즈 근사
            f = np.fft.rfftfreq(TARGET_SAMPLES)
            f[0] = 1e-6
            spectrum = np.random.randn(len(f)) / np.sqrt(f)
            audio = np.fft.irfft(spectrum, n=TARGET_SAMPLES).astype(np.float32)
            audio = normalize(audio, peak=0.1)
        else:
            # 음성 유사 신호 (여러 사인파 합성)
            t = np.linspace(0, TARGET_DURATION, TARGET_SAMPLES)
            audio = np.zeros(TARGET_SAMPLES, dtype=np.float32)
            for _ in range(random.randint(2, 5)):
                freq = random.uniform(80, 3000)
                audio += np.sin(2 * np.pi * freq * t).astype(np.float32) * random.uniform(0.01, 0.1)
            audio = normalize(audio, peak=0.15)

        out_path = output_dir / f"noise_{noise_type}_{i:05d}.wav"
        save_wav(out_path, audio)
        generated += 1
    return generated


def download_common_voice_samples(count: int, output_dir: Path) -> int:
    """Common Voice 샘플 다운로드 (선택)."""
    print("[negative] Common Voice 다운로드는 별도 수동 작업이 필요합니다.")
    print("  https://commonvoice.mozilla.org/en/datasets 에서 영어 데이터 다운로드 후")
    print("  data/negative/ 에 WAV 파일을 직접 복사하세요.")
    return 0


# ── 증강 파이프라인 ────────────────────────────────────────────────────────────

def run_augmentation(positive_dir: Path, augmented_dir: Path, max_per_file: int = 5) -> int:
    """positive 샘플에서 증강 버전 생성."""
    positive_files = list(positive_dir.glob("*.wav"))
    if not positive_files:
        print("[augment] positive 샘플이 없습니다.", file=sys.stderr)
        return 0

    total = 0
    for wav_path in tqdm(positive_files, desc="augmentation", unit="파일"):
        try:
            audio = load_wav(wav_path)
            variants = augment_audio(audio)
            # max_per_file 개만 랜덤 선택
            selected = random.sample(variants, min(max_per_file, len(variants)))
            for j, aug_audio in enumerate(selected):
                aug_audio = normalize(aug_audio)
                aug_audio = pad_or_trim(aug_audio, TARGET_SAMPLES)
                out_path = augmented_dir / f"{wav_path.stem}_aug{j:02d}.wav"
                save_wav(out_path, aug_audio)
                total += 1
        except Exception as exc:
            print(f"[augment] {wav_path.name} 실패: {exc}", file=sys.stderr)

    return total


# ── 메인 ──────────────────────────────────────────────────────────────────────

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="'hi blooming' 웨이크워드 합성 학습 샘플 생성기"
    )
    parser.add_argument(
        "--count", type=int, default=2000,
        help="목표 positive 샘플 수 (기본: 2000)"
    )
    parser.add_argument(
        "--tts", choices=["piper", "gtts", "both"], default="both",
        help="TTS 엔진 선택 (기본: both)"
    )
    parser.add_argument(
        "--negative-count", type=int, default=3000,
        help="negative 샘플 수 (기본: 3000)"
    )
    parser.add_argument(
        "--skip-negative", action="store_true",
        help="negative 샘플 생성 건너뜀"
    )
    parser.add_argument(
        "--augment-only", action="store_true",
        help="증강만 재실행 (기존 positive 샘플 기준)"
    )
    parser.add_argument(
        "--augment-per-file", type=int, default=5,
        help="파일당 증강 버전 수 (기본: 5)"
    )
    parser.add_argument(
        "--piper-models-dir",
        default=str(SCRIPT_DIR / "piper_models"),
        help="piper-tts 모델 저장 경로"
    )
    return parser


def main() -> None:
    args = build_parser().parse_args()

    # 디렉토리 생성
    for d in [POSITIVE_DIR, NEGATIVE_DIR, AUGMENTED_DIR]:
        d.mkdir(parents=True, exist_ok=True)

    piper_models_dir = Path(args.piper_models_dir)

    if args.augment_only:
        print("\n[generate] 증강 전용 모드")
        n = run_augmentation(POSITIVE_DIR, AUGMENTED_DIR, args.augment_per_file)
        print(f"[generate] 증강 샘플 {n}개 생성 완료 → {AUGMENTED_DIR}")
        return

    # ── Positive 샘플 생성 ────────────────────────────────────────────────────
    print(f"\n[generate] positive 샘플 목표: {args.count}개")
    total_positive = 0

    if args.tts in ("piper", "both"):
        print("[generate] piper-tts 합성 시작...")
        per_model = max(1, args.count // (2 * len(PIPER_MODELS)) if args.tts == "both"
                        else args.count // len(PIPER_MODELS))
        n = generate_piper_samples(per_model, POSITIVE_DIR, piper_models_dir)
        print(f"  → piper-tts: {n}개 생성")
        total_positive += n

    if args.tts in ("gtts", "both"):
        remaining = max(0, args.count - total_positive)
        if remaining > 0:
            print(f"[generate] gTTS 합성 시작 (목표: {remaining}개)...")
            n = generate_gtts_samples(remaining, POSITIVE_DIR)
            print(f"  → gTTS: {n}개 생성")
            total_positive += n

    print(f"\n[generate] positive 샘플 합계: {total_positive}개")

    # ── 증강 ─────────────────────────────────────────────────────────────────
    print(f"\n[generate] 증강 샘플 생성 중 (파일당 {args.augment_per_file}개)...")
    n_aug = run_augmentation(POSITIVE_DIR, AUGMENTED_DIR, args.augment_per_file)
    print(f"  → 증강: {n_aug}개")

    # ── Negative 샘플 생성 ───────────────────────────────────────────────────
    if not args.skip_negative:
        print(f"\n[generate] negative 샘플 생성 중 (목표: {args.negative_count}개)...")
        n_neg = generate_silence_noise_negatives(args.negative_count, NEGATIVE_DIR)
        print(f"  → negative: {n_neg}개")
    else:
        print("\n[generate] negative 샘플 생성 건너뜀")

    # ── 요약 ─────────────────────────────────────────────────────────────────
    pos_count = len(list(POSITIVE_DIR.glob("*.wav")))
    aug_count = len(list(AUGMENTED_DIR.glob("*.wav")))
    neg_count = len(list(NEGATIVE_DIR.glob("*.wav")))

    print("\n" + "━" * 60)
    print(" 샘플 생성 완료!")
    print("━" * 60)
    print(f"  positive  : {pos_count:,}개  ({POSITIVE_DIR})")
    print(f"  augmented : {aug_count:,}개  ({AUGMENTED_DIR})")
    print(f"  negative  : {neg_count:,}개  ({NEGATIVE_DIR})")
    print()
    print("  다음 단계: python WakeOnWord/train.py")
    print("━" * 60)


if __name__ == "__main__":
    main()
