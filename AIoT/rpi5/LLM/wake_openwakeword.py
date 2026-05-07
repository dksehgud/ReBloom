import argparse
import contextlib
import inspect
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import warnings
from pathlib import Path

import numpy as np

try:
    from etc.voice_runtime import choose_alsa_device, write_tone_wav
except ModuleNotFoundError:
    from .etc.voice_runtime import choose_alsa_device, write_tone_wav


SAMPLE_RATE = 16000
FRAME_MS = 80
FRAME_SAMPLES = int(SAMPLE_RATE * FRAME_MS / 1000)
FRAME_BYTES = FRAME_SAMPLES * 2
NO_RECOGNIZED_SPEECH_EXIT_CODE = 20
DEFAULT_WAKE_LABEL = "hi_blooming"


def require_command(command):
    if shutil.which(command):
        return
    raise RuntimeError(f"`{command}` 명령을 찾을 수 없습니다.")


def split_csv(value):
    return [item.strip() for item in value.split(",") if item.strip()]


def default_model_paths():
    return split_csv(os.getenv("REBLOOM_OPENWAKEWORD_MODELS", ""))


@contextlib.contextmanager
def suppress_stderr_fd():
    sys.stderr.flush()
    original_fd = os.dup(2)
    try:
        with open(os.devnull, "w", encoding="utf-8") as devnull:
            os.dup2(devnull.fileno(), 2)
            yield
    finally:
        os.dup2(original_fd, 2)
        os.close(original_fd)


def resolve_audio_device(device):
    if device != "auto":
        return device
    selected = choose_alsa_device("arecord")
    if not selected:
        raise RuntimeError("자동 선택 가능한 마이크 입력 장치를 찾지 못했습니다.")
    print(f"[wake] 입력 장치 자동 선택: {selected}", flush=True)
    return selected


def build_voice_command(args, extra_voice_args):
    python_bin = args.python_bin or sys.executable
    voice_chat = Path(__file__).with_name("voice_chat.py")
    return [
        python_bin,
        str(voice_chat),
        "--once",
        "--wake-mode",
        "off",
        *extra_voice_args,
    ]


def play_wake_ack(args):
    if args.ack_sound == "off":
        return
    if not shutil.which(args.aplay_bin):
        return

    output_device = args.output_device
    if output_device == "auto":
        output_device = choose_alsa_device("aplay")

    with tempfile.TemporaryDirectory(prefix="rebloom_wake_ack_") as temp_dir:
        wav_path = Path(temp_dir) / "wake.wav"
        write_tone_wav(wav_path, frequency=1040, duration=0.16, volume=0.22)
        command = [args.aplay_bin, "-q"]
        if output_device:
            command.extend(["-D", output_device])
        command.append(str(wav_path))
        subprocess.run(command, check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def load_model(model_paths):
    os.environ.setdefault("ORT_LOG_SEVERITY_LEVEL", "3")
    try:
        if os.getenv("REBLOOM_OPENWAKEWORD_DEBUG", "0") == "1":
            from openwakeword.model import Model
        else:
            with suppress_stderr_fd():
                with open(os.devnull, "w", encoding="utf-8") as devnull:
                    with contextlib.redirect_stderr(devnull):
                        from openwakeword.model import Model
    except ImportError as exc:
        raise RuntimeError(
            "openWakeWord가 설치되어 있지 않습니다. "
            "`python3 -m pip install openwakeword` 후 다시 실행하세요."
        ) from exc

    def create_model():
        if not model_paths:
            return Model()

        parameters = inspect.signature(Model.__init__).parameters
        try:
            if "wakeword_model_paths" in parameters:
                return Model(wakeword_model_paths=model_paths)
            return Model(wakeword_models=model_paths)
        except (IndexError, TypeError):
            return load_wakeonword_model(model_paths)

    if os.getenv("REBLOOM_OPENWAKEWORD_DEBUG", "0") == "1":
        return create_model()

    with suppress_stderr_fd():
        with open(os.devnull, "w", encoding="utf-8") as devnull:
            with contextlib.redirect_stderr(devnull):
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    return create_model()


def prediction_score(prediction):
    if not prediction:
        return "", 0.0
    name, score = max(prediction.items(), key=lambda item: item[1])
    return name, float(score)


def reset_wake_model(model):
    reset = getattr(model, "reset", None)
    if callable(reset):
        reset()


def wake_label_from_meta(model_path):
    meta_path = Path(model_path).with_name(f"{Path(model_path).stem}_meta.json")
    if not meta_path.exists():
        return DEFAULT_WAKE_LABEL

    try:
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return DEFAULT_WAKE_LABEL

    wake_word = str(meta.get("wake_word", "")).strip()
    if not wake_word:
        return DEFAULT_WAKE_LABEL
    return wake_word.replace(" ", "_")


class WakeOnWordModel:
    def __init__(self, model_path):
        import onnxruntime as ort

        self.model_path = str(model_path)
        self.label = wake_label_from_meta(model_path)
        self.session = ort.InferenceSession(self.model_path, providers=["CPUExecutionProvider"])
        self.input_name = self.session.get_inputs()[0].name
        input_shape = self.session.get_inputs()[0].shape
        self.window_frames = int(input_shape[1]) if len(input_shape) >= 3 and isinstance(input_shape[1], int) else 16
        self.feature_dim = int(input_shape[2]) if len(input_shape) >= 3 and isinstance(input_shape[2], int) else 40
        self.embedder = None
        self.mel_filters = self._build_mel_filters()
        if self.feature_dim != 40:
            with suppress_stderr_fd():
                with open(os.devnull, "w", encoding="utf-8") as devnull:
                    with contextlib.redirect_stderr(devnull):
                        from openwakeword.utils import AudioFeatures
            self.embedder = AudioFeatures()
        self.buffer = []

    def reset(self):
        self.buffer.clear()

    def predict(self, frame_int16):
        embedding = self._embedding(frame_int16)
        if embedding is None:
            return {}

        self.buffer.append(embedding)
        if len(self.buffer) > self.window_frames:
            self.buffer.pop(0)
        if len(self.buffer) < self.window_frames:
            return {self.label: 0.0}

        features = np.array(self.buffer, dtype=np.float32)
        if self.feature_dim == 40:
            features = self._power_to_db(features)
        features = features[np.newaxis]
        output = self.session.run(None, {self.input_name: features})[0]
        return {self.label: float(output.flatten()[0])}

    def _embedding(self, frame_int16):
        if self.feature_dim == 40:
            return self._mel_embedding(frame_int16)

        try:
            model = getattr(self.embedder, "embed_model", None) or getattr(self.embedder, "embedding_model", None)
            embedding = model.predict(frame_int16) if model else None
        except Exception:
            return None
        if embedding is None:
            return None
        return embedding.flatten()

    def _mel_embedding(self, frame_int16):
        audio = frame_int16.astype(np.float32) / 32767.0
        windowed = audio * np.hanning(len(audio)).astype(np.float32)
        spectrum = np.abs(np.fft.rfft(windowed)) ** 2
        mel_energy = self.mel_filters @ spectrum
        return mel_energy.astype(np.float32)

    def _power_to_db(self, mel_energy):
        reference = float(np.max(mel_energy))
        if reference <= 1e-10:
            return np.full_like(mel_energy, -80.0, dtype=np.float32)

        db = 10.0 * np.log10(np.maximum(mel_energy, 1e-10) / reference)
        return np.maximum(db, -80.0).astype(np.float32)

    def _build_mel_filters(self):
        fft_bins = FRAME_SAMPLES // 2 + 1
        frequencies = np.linspace(0, SAMPLE_RATE / 2, fft_bins)
        mel_min = 2595 * np.log10(1 + 20 / 700)
        mel_max = 2595 * np.log10(1 + (SAMPLE_RATE / 2) / 700)
        mel_points = np.linspace(mel_min, mel_max, self.feature_dim + 2)
        hz_points = 700 * (10 ** (mel_points / 2595) - 1)

        filters = np.zeros((self.feature_dim, fft_bins), dtype=np.float32)
        for index in range(self.feature_dim):
            left, center, right = hz_points[index:index + 3]
            up = (frequencies - left) / max(center - left, 1e-6)
            down = (right - frequencies) / max(right - center, 1e-6)
            filters[index] = np.maximum(0, np.minimum(up, down))

        row_sums = filters.sum(axis=1, keepdims=True)
        return filters / np.maximum(row_sums, 1e-6)


def load_wakeonword_model(model_paths):
    if len(model_paths) != 1:
        raise RuntimeError("WakeOnWord 모델은 한 번에 하나만 지정할 수 있습니다.")
    return WakeOnWordModel(model_paths[0])


def run_detector(args, extra_voice_args):
    require_command("arecord")
    audio_device = resolve_audio_device(args.audio_device)
    model = load_model(args.model_paths)
    voice_command = build_voice_command(args, extra_voice_args)

    command = [
        "arecord",
        "-q",
        "-f",
        "S16_LE",
        "-r",
        str(SAMPLE_RATE),
        "-c",
        "1",
        "-t",
        "raw",
    ]
    if audio_device:
        command.extend(["-D", audio_device])

    print("[wake] openWakeWord 호출어 대기 시작", flush=True)
    if not args.model_paths:
        print("[wake] 모델 경로가 없어 openWakeWord 기본 모델을 사용합니다.", flush=True)

    suppressed_wake_name = ""
    suppress_until = 0.0
    while True:
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        try:
            while True:
                frame = process.stdout.read(FRAME_BYTES) if process.stdout else b""
                if len(frame) < FRAME_BYTES:
                    detail = process.stderr.read().decode("utf-8", errors="replace").strip() if process.stderr else ""
                    raise RuntimeError(f"마이크 입력을 읽지 못했습니다.\narecord output:\n{detail}")

                audio = np.frombuffer(frame, dtype=np.int16)
                prediction = model.predict(audio)
                wake_name, score = prediction_score(prediction)
                if args.debug and wake_name:
                    print(f"[wake-debug] {wake_name}={score:.6f}", flush=True)
                if score >= args.threshold:
                    now = time.monotonic()
                    if wake_name == suppressed_wake_name and now < suppress_until:
                        continue
                    suppressed_wake_name = ""
                    suppress_until = 0.0
                    print(f"[wake] 감지됨: {wake_name} ({score:.3f})", flush=True)
                    process.terminate()
                    try:
                        process.wait(timeout=1)
                    except subprocess.TimeoutExpired:
                        process.kill()
                    reset_wake_model(model)
                    if args.ack_delay_seconds > 0:
                        time.sleep(args.ack_delay_seconds)
                    play_wake_ack(args)
                    result = subprocess.run(voice_command, check=False)
                    if result.returncode == NO_RECOGNIZED_SPEECH_EXIT_CODE:
                        print("[wake] 인식된 문장이 없어 다시 호출어 대기 상태로 돌아갑니다.", flush=True)
                        if args.no_speech_suppress_seconds > 0:
                            suppressed_wake_name = wake_name
                            suppress_until = time.monotonic() + args.no_speech_suppress_seconds
                    elif result.returncode != 0:
                        print(f"[wake] 대화 프로세스가 오류로 끝났습니다: exit={result.returncode}", flush=True)
                    if args.rearm_seconds > 0:
                        time.sleep(args.rearm_seconds)
                    print("[wake] 호출어 대기 상태로 돌아갑니다.", flush=True)
                    break
        finally:
            if process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=1)
                except subprocess.TimeoutExpired:
                    process.kill()


def build_parser():
    parser = argparse.ArgumentParser(description="Re:Bloom openWakeWord listener")
    parser.add_argument("--audio-device", default=os.getenv("REBLOOM_AUDIO_DEVICE", "auto"))
    parser.add_argument(
        "--model-paths",
        default=default_model_paths(),
        nargs="*",
        help="openWakeWord .onnx/.tflite 모델 경로 목록입니다. 없으면 openWakeWord 기본 모델을 사용합니다.",
    )
    parser.add_argument("--threshold", type=float, default=float(os.getenv("REBLOOM_OPENWAKEWORD_THRESHOLD", "0.5")))
    parser.add_argument(
        "--rearm-seconds",
        type=float,
        default=float(os.getenv("REBLOOM_OPENWAKEWORD_REARM_SECONDS", "2")),
        help="호출어 감지 후 다시 대기하기 전 쉬는 시간입니다.",
    )
    parser.add_argument(
        "--no-speech-suppress-seconds",
        type=float,
        default=float(os.getenv("REBLOOM_OPENWAKEWORD_NO_SPEECH_SUPPRESS_SECONDS", "15")),
        help="호출 후 문장이 없을 때 같은 wake 이름을 무시하는 시간입니다.",
    )
    parser.add_argument("--python-bin", default=os.getenv("REBLOOM_PYTHON", ""))
    parser.add_argument("--output-device", default=os.getenv("REBLOOM_OUTPUT_DEVICE", "auto"))
    parser.add_argument("--aplay-bin", default=os.getenv("REBLOOM_APLAY_BIN", "aplay"))
    parser.add_argument(
        "--ack-delay-seconds",
        type=float,
        default=float(os.getenv("REBLOOM_OPENWAKEWORD_ACK_DELAY_SECONDS", "1")),
        help="호출어 감지 후 비프음을 재생하기 전 대기 시간입니다.",
    )
    parser.add_argument(
        "--ack-sound",
        choices=["on", "off"],
        default=os.getenv("REBLOOM_OPENWAKEWORD_ACK_SOUND", "on"),
    )
    parser.add_argument("--debug", action="store_true", default=os.getenv("REBLOOM_OPENWAKEWORD_DEBUG", "0") == "1")
    return parser


def main():
    parser = build_parser()
    args, extra_voice_args = parser.parse_known_args()
    try:
        run_detector(args, extra_voice_args)
    except KeyboardInterrupt:
        return
    except (RuntimeError, subprocess.CalledProcessError) as exc:
        print(f"Error: {exc}", file=sys.stderr, flush=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
