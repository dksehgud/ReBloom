import argparse
import contextlib
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


def require_command(command):
    if shutil.which(command):
        return
    raise RuntimeError(f"`{command}` 명령을 찾을 수 없습니다.")


def split_csv(value):
    return [item.strip() for item in value.split(",") if item.strip()]


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

    if os.getenv("REBLOOM_OPENWAKEWORD_DEBUG", "0") == "1":
        if model_paths:
            return Model(wakeword_models=model_paths)
        return Model()

    with suppress_stderr_fd():
        with open(os.devnull, "w", encoding="utf-8") as devnull:
            with contextlib.redirect_stderr(devnull):
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    if model_paths:
                        return Model(wakeword_models=model_paths)
                    return Model()


def prediction_score(prediction):
    if not prediction:
        return "", 0.0
    name, score = max(prediction.items(), key=lambda item: item[1])
    return name, float(score)


def reset_wake_model(model):
    reset = getattr(model, "reset", None)
    if callable(reset):
        reset()


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
                    print(f"[wake-debug] {wake_name}={score:.3f}", flush=True)
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
                    play_wake_ack(args)
                    result = subprocess.run(voice_command, check=False)
                    reset_wake_model(model)
                    if result.returncode == NO_RECOGNIZED_SPEECH_EXIT_CODE:
                        print("[wake] 인식된 문장이 없어 다시 호출어 대기 상태로 돌아갑니다.", flush=True)
                        if args.no_speech_suppress_seconds > 0:
                            suppressed_wake_name = wake_name
                            suppress_until = time.monotonic() + args.no_speech_suppress_seconds
                    if args.rearm_seconds > 0:
                        time.sleep(args.rearm_seconds)
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
        default=split_csv(os.getenv("REBLOOM_OPENWAKEWORD_MODELS", "")),
        nargs="*",
        help="openWakeWord .tflite 모델 경로 목록입니다. 없으면 기본 모델을 사용합니다.",
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
