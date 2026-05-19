#!/usr/bin/env python3
"""
test_wake_word.py — "hi blooming" 실시간 웨이크워드 테스트
==========================================================

학습된 hi_blooming.onnx 모델로 마이크에서 실시간으로 웨이크워드를 감지합니다.
Raspberry Pi 5에서 실행하기 위한 스크립트입니다.

사용법:
    python test_wake_word.py                             # 기본 테스트
    python test_wake_word.py --model models/hi_blooming.onnx
    python test_wake_word.py --threshold 0.3            # 감지 임계값 조정
    python test_wake_word.py --debug                    # 프레임별 점수 출력
    python test_wake_word.py --device auto              # 마이크 자동 감지
    python test_wake_word.py --list-devices             # 장치 목록
    python test_wake_word.py --test-file audio.wav      # 파일로 테스트
"""

from __future__ import annotations

import argparse
import contextlib
import os
import subprocess
import sys
import time
import warnings
import queue
import shutil
from pathlib import Path

import numpy as np

SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent
# 프로덕션 모델(96-dim OWW 임베딩)을 기본으로 사용, 없으면 로컬 모델로 폴백
_PROD_MODEL = ROOT_DIR / "serverchatting" / "Wake_Model" / "hi_blooming.onnx"
DEFAULT_MODEL = _PROD_MODEL if _PROD_MODEL.exists() else SCRIPT_DIR / "models" / "hi_blooming.onnx"

TARGET_SR = 16_000
FRAME_MS = 80
FRAME_SAMPLES = int(TARGET_SR * FRAME_MS / 1000)   # 1280

# 감지에 필요한 연속 프레임 수 (N_FRAMES * FRAME_MS ms 이내)
N_FRAMES = 16


# ── 장치 유틸 ─────────────────────────────────────────────────────────────────

def list_audio_devices() -> None:
    """arecord -l 출력."""
    try:
        result = subprocess.run(["arecord", "-l"], capture_output=True, text=True)
        print(result.stdout)
    except FileNotFoundError:
        # sounddevice fallback
        try:
            import sounddevice as sd
            print(sd.query_devices())
        except ImportError:
            print("arecord 또는 sounddevice가 없습니다.", file=sys.stderr)


def auto_select_device() -> str | None:
    """arecord -l에서 첫 번째 마이크 장치 선택."""
    try:
        result = subprocess.run(["arecord", "-l"], capture_output=True, text=True)
        for line in result.stdout.splitlines():
            if "card" in line.lower() and "device" in line.lower():
                import re
                m = re.search(r"card (\d+).*device (\d+)", line, re.IGNORECASE)
                if m:
                    card, dev = m.group(1), m.group(2)
                    return f"hw:{card},{dev}"
    except FileNotFoundError:
        pass
    return None


# ── 모델 로드 ─────────────────────────────────────────────────────────────────

def load_onnx_model(model_path: Path):
    """ONNX 모델 로드 (onnxruntime 또는 openWakeWord)."""
    if not model_path.exists():
        raise FileNotFoundError(
            f"모델 파일이 없습니다: {model_path}\n"
            f"먼저 `python WakeOnWord/train.py`로 모델을 학습하세요."
        )

    try:
        import onnxruntime as ort
        session = ort.InferenceSession(str(model_path))
        input_shape = session.get_inputs()[0].shape
        feat_dim = int(input_shape[2]) if len(input_shape) >= 3 and isinstance(input_shape[2], int) else 40
        print(f"[test] ONNX 모델 로드: {model_path.name}  (입력 shape={input_shape}, feat_dim={feat_dim})")
        return session
    except ImportError:
        raise RuntimeError(
            "onnxruntime 미설치. `pip install onnxruntime`으로 설치하세요."
        )


def get_model_feat_dim(session) -> int:
    input_shape = session.get_inputs()[0].shape
    if len(input_shape) >= 3 and isinstance(input_shape[2], int):
        return int(input_shape[2])
    return 40


def predict_score(session, feature: np.ndarray) -> float:
    """특징 벡터 → 웨이크워드 감지 점수 (0~1)."""
    input_name = session.get_inputs()[0].name
    feat_in = feature[np.newaxis].astype(np.float32)  # (1, N_FRAMES, feat_dim)
    output = session.run(None, {input_name: feat_in})[0]
    return float(output.flatten()[0])


# ── openWakeWord 임베딩 ───────────────────────────────────────────────────────

@contextlib.contextmanager
def suppress_stderr():
    """stderr 억제 컨텍스트."""
    sys.stderr.flush()
    fd = os.dup(2)
    try:
        with open(os.devnull, "w") as devnull:
            os.dup2(devnull.fileno(), 2)
            yield
    finally:
        os.dup2(fd, 2)
        os.close(fd)


class AudioEmbedder:
    """오디오 프레임 → 임베딩 버퍼 (슬라이딩 윈도우)."""

    def __init__(self, n_frames: int = N_FRAMES, feat_dim: int | None = None) -> None:
        self.n_frames = n_frames
        self._target_feat_dim = feat_dim  # 모델이 기대하는 feature 차원 (None이면 자동)
        self._buffer: list[np.ndarray] = []
        self._embedder = None
        self._feat_dim: int | None = None
        self._use_mfcc = False
        self._init_embedder()

    def _init_embedder(self) -> None:
        """openWakeWord 임베딩 모델 초기화. feat_dim=40이면 MFCC를 강제 사용."""
        if self._target_feat_dim == 40:
            print("[test] 모델이 40-dim 특징을 기대합니다. MFCC 특징을 사용합니다.")
            self._use_mfcc = True
            return
        try:
            with suppress_stderr():
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    from openwakeword.utils import AudioFeatures
            self._embedder = AudioFeatures()
            print("[test] openWakeWord 임베딩 모델 로드 완료 (96-dim)")
        except Exception as exc:
            print(f"[test] openWakeWord 임베딩 불가: {exc}")
            print("[test] 간단한 MFCC 특징을 사용합니다.")
            self._use_mfcc = True

    def process_frame(self, frame_int16: np.ndarray) -> np.ndarray | None:
        """
        80ms 오디오 프레임(int16) → 임베딩 추가 → N_FRAMES 길이 특징 행렬 반환.
        아직 N_FRAMES만큼 쌓이지 않으면 None 반환.
        """
        if self._use_mfcc:
            emb = self._mfcc_embedding(frame_int16)
        else:
            emb = self._oww_embedding(frame_int16)

        if emb is None:
            return None

        self._buffer.append(emb)
        if len(self._buffer) > self.n_frames:
            self._buffer.pop(0)

        if len(self._buffer) < self.n_frames:
            return None

        feat = np.array(self._buffer, dtype=np.float32)  # (N_FRAMES, feat_dim)
        if self._feat_dim is None:
            self._feat_dim = feat.shape[1]
        return feat

    def _oww_embedding(self, frame_int16: np.ndarray) -> np.ndarray | None:
        """openWakeWord 내장 임베딩."""
        try:
            emb = self._embedder.embed_model.predict(frame_int16)
            if emb is not None:
                return emb.flatten()
        except Exception:
            pass
        return None

    def _mfcc_embedding(self, frame_int16: np.ndarray) -> np.ndarray:
        """간단한 MFCC 기반 특징 (librosa 없을 때 수동 구현)."""
        audio_f32 = frame_int16.astype(np.float32) / 32767.0
        # 간단한 에너지 + 스펙트럼 중심값
        energy = float(np.sqrt(np.mean(audio_f32 ** 2)))
        fft = np.abs(np.fft.rfft(audio_f32))
        freqs = np.fft.rfftfreq(len(audio_f32), 1 / TARGET_SR)
        centroid = float(np.sum(freqs * fft) / (np.sum(fft) + 1e-8))
        # 8개 밴드 에너지
        n_bins = len(fft)
        band_energy = []
        for i in range(8):
            start = i * n_bins // 8
            end = (i + 1) * n_bins // 8
            band_energy.append(float(np.mean(fft[start:end])))

        feat = np.array([energy, centroid / 4000.0] + band_energy, dtype=np.float32)
        return feat

    def reset(self) -> None:
        self._buffer.clear()


# ── 파일 테스트 ───────────────────────────────────────────────────────────────

def test_with_file(args: argparse.Namespace) -> None:
    """오디오 파일로 모델 테스트."""
    import soundfile as sf
    from scipy.signal import resample_poly

    wav_path = Path(args.test_file)
    if not wav_path.exists():
        print(f"파일이 없습니다: {wav_path}", file=sys.stderr)
        sys.exit(1)

    audio, sr = sf.read(str(wav_path), dtype="float32")
    if audio.ndim > 1:
        audio = audio.mean(axis=1)
    if sr != TARGET_SR:
        audio = resample_poly(audio, TARGET_SR, sr).astype(np.float32)

    model_path = Path(args.model)
    session = load_onnx_model(model_path)
    embedder = AudioEmbedder(N_FRAMES, feat_dim=get_model_feat_dim(session))

    audio_int16 = (np.clip(audio, -1.0, 1.0) * 32767).astype(np.int16)
    max_score = 0.0
    detected = False

    for start in range(0, len(audio_int16) - FRAME_SAMPLES + 1, FRAME_SAMPLES):
        frame = audio_int16[start:start + FRAME_SAMPLES]
        feat = embedder.process_frame(frame)
        if feat is None:
            continue
        score = predict_score(session, feat)
        max_score = max(max_score, score)

        if args.debug:
            t_sec = start / TARGET_SR
            print(f"  t={t_sec:.2f}s  score={score:.4f}")

        if score >= args.threshold and not detected:
            t_sec = start / TARGET_SR
            print(f"\n  ✓ 웨이크워드 감지! (t={t_sec:.2f}s, score={score:.4f})")
            detected = True

    print(f"\n파일: {wav_path.name}")
    print(f"최고 점수: {max_score:.4f}")
    print(f"결과: {'✓ 감지됨' if detected else '✗ 미감지'} (임계값={args.threshold})")


# ── 실시간 마이크 테스트 ──────────────────────────────────────────────────────

def run_live_detection(args: argparse.Namespace) -> None:
    """arecord 또는 sounddevice로 마이크 스트림 읽어 실시간 감지."""
    model_path = Path(args.model)
    session = load_onnx_model(model_path)
    embedder = AudioEmbedder(N_FRAMES, feat_dim=get_model_feat_dim(session))

    print()
    print("━" * 60)
    print(f" hi blooming 실시간 감지 시작")
    print(f" 모델:    {model_path.name}")
    print(f" 임계값:  {args.threshold}")
    print(f" 종료:    Ctrl+C")
    print("━" * 60)
    print()

    has_arecord = False
    if shutil.which("arecord") is not None:
        try:
            res = subprocess.run(["arecord", "-l"], capture_output=True, text=True)
            if "no soundcards found" not in res.stderr.lower() and "no soundcards found" not in res.stdout.lower():
                has_arecord = True
        except Exception:
            pass

    if getattr(args, "use_sd", False) or not has_arecord:
        print("[test] PC 환경(또는 사용 가능한 마이크 없음) - sounddevice를 사용합니다.")
        _run_live_detection_sd(args, session, embedder)
    else:
        _run_live_detection_arecord(args, session, embedder)

def _run_live_detection_arecord(args: argparse.Namespace, session, embedder: AudioEmbedder) -> None:
    # 장치 선택
    device = args.device
    if device == "auto":
        device = auto_select_device()
        if device:
            print(f"[test] 마이크 자동 선택: {device}")
        else:
            print("[test] 기본 마이크 사용")
            device = None

    # arecord 명령
    cmd = ["arecord", "-q", "-f", "S16_LE", "-r", str(TARGET_SR), "-c", "1", "-t", "raw"]
    if device:
        cmd.extend(["-D", device])

    detect_count = 0
    frame_count = 0
    start_time = time.monotonic()
    last_detect_time = 0.0
    suppress_seconds = 2.0
    proc = None

    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        print("[test] 🎙  대기 중... \"hi blooming\"을 말해보세요.")

        while True:
            raw = proc.stdout.read(FRAME_SAMPLES * 2)  # int16 = 2 bytes
            if len(raw) < FRAME_SAMPLES * 2:
                err = proc.stderr.read().decode("utf-8", errors="replace").strip()
                raise RuntimeError(f"마이크 읽기 실패: {err}")

            frame_int16 = np.frombuffer(raw, dtype=np.int16)
            feat = embedder.process_frame(frame_int16)
            frame_count += 1

            if feat is None:
                continue

            score = predict_score(session, feat)

            if args.debug:
                elapsed = time.monotonic() - start_time
                print(f"\r  [{elapsed:6.1f}s] score={score:.4f}  ", end="", flush=True)

            now = time.monotonic()
            if score >= args.threshold:
                if now - last_detect_time < suppress_seconds:
                    continue   # 억제 기간 중

                detect_count += 1
                last_detect_time = now
                elapsed = now - start_time
                print(f"\n  ★ 감지! [{elapsed:.1f}s] score={score:.4f}  (총 {detect_count}회)")
                embedder.reset()

    except KeyboardInterrupt:
        print("\n\n[test] 종료")
    finally:
        if proc is not None and proc.poll() is None:
            proc.terminate()
            try:
                proc.wait(timeout=2)
            except subprocess.TimeoutExpired:
                proc.kill()

    elapsed = time.monotonic() - start_time
    print()
    print("━" * 60)
    print(f" 결과: {detect_count}회 감지 / {elapsed:.0f}초 실행")
    print("━" * 60)

def _run_live_detection_sd(args: argparse.Namespace, session, embedder: AudioEmbedder) -> None:
    try:
        import sounddevice as sd
    except ImportError:
        raise RuntimeError("sounddevice 패키지가 필요합니다. `pip install sounddevice`를 실행해주세요.")
    except OSError as e:
        if "PortAudio" in str(e):
            raise RuntimeError(
                "\n[오류] PortAudio 라이브러리를 찾을 수 없습니다.\n"
                "WSL(리눅스) 환경인 경우 다음 명령어로 설치해주세요:\n"
                "  sudo apt-get install libportaudio2\n\n"
                "※ 단, WSL에서는 마이크 연결이 원활하지 않을 수 있으므로 윈도우 네이티브(CMD)에서 실행하는 것을 가장 권장합니다."
            ) from e
        raise e

    q = queue.Queue()

    def callback(indata, frames, time_info, status):
        if status:
            print(status, file=sys.stderr)
        q.put(indata.copy())

    detect_count = 0
    start_time = time.monotonic()
    last_detect_time = 0.0
    suppress_seconds = 2.0

    print("[test] 🎙  대기 중 (sounddevice)... \"hi blooming\"을 말해보세요.")
    try:
        with sd.InputStream(samplerate=TARGET_SR, channels=1, dtype='int16', callback=callback):
            buffer = np.array([], dtype=np.int16)
            while True:
                data = q.get()
                buffer = np.concatenate((buffer, data.flatten()))
                
                while len(buffer) >= FRAME_SAMPLES:
                    frame = buffer[:FRAME_SAMPLES]
                    buffer = buffer[FRAME_SAMPLES:]
                    
                    feat = embedder.process_frame(frame)
                    if feat is None:
                        continue
                        
                    score = predict_score(session, feat)

                    if args.debug:
                        elapsed = time.monotonic() - start_time
                        print(f"\r  [{elapsed:6.1f}s] score={score:.4f}  ", end="", flush=True)

                    now = time.monotonic()
                    if score >= args.threshold:
                        if now - last_detect_time < suppress_seconds:
                            continue   # 억제 기간 중
                        
                        detect_count += 1
                        last_detect_time = now
                        elapsed = now - start_time
                        print(f"\n  ★ 감지! [{elapsed:.1f}s] score={score:.4f}  (총 {detect_count}회)")
                        embedder.reset()
    except KeyboardInterrupt:
        print("\n\n[test] 종료")
    
    elapsed = time.monotonic() - start_time
    print()
    print("━" * 60)
    print(f" 결과: {detect_count}회 감지 / {elapsed:.0f}초 실행")
    print("━" * 60)


# ── 메인 ──────────────────────────────────────────────────────────────────────

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="hi blooming 웨이크워드 실시간 테스트"
    )
    parser.add_argument(
        "--model",
        default=str(DEFAULT_MODEL),
        help=f"ONNX 모델 경로 (기본: {DEFAULT_MODEL})"
    )
    parser.add_argument(
        "--threshold", type=float, default=0.2,
        help="감지 임계값 0~1 (기본: 0.2)"
    )
    parser.add_argument(
        "--device", default="auto",
        help="마이크 장치 (auto / hw:0,0 등, 기본: auto)"
    )
    parser.add_argument(
        "--debug", action="store_true",
        help="프레임별 점수 출력"
    )
    parser.add_argument(
        "--list-devices", action="store_true",
        help="오디오 장치 목록 출력 후 종료"
    )
    parser.add_argument(
        "--test-file", default=None,
        help="실시간 대신 파일로 테스트 (WAV 경로)"
    )
    parser.add_argument(
        "--use-sd", action="store_true",
        help="arecord 대신 sounddevice 모듈을 강제 사용합니다 (PC 환경용)"
    )
    return parser


def main() -> None:
    args = build_parser().parse_args()

    if args.list_devices:
        list_audio_devices()
        return

    if args.test_file:
        test_with_file(args)
        return

    run_live_detection(args)


if __name__ == "__main__":
    main()
