import array
import asyncio
import importlib.util
import math
import os
import re
import shutil
import signal
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
import wave
from pathlib import Path


START_SOUND_WARNING_SHOWN = False
STT_SOUND_WARNING_SHOWN = False
START_SOUND_BUSY_MARKERS = (
    "device or resource busy",
    "resource busy",
    "장치나 자원이 동작 중",
)


class AudioOutputUnavailableError(RuntimeError):
    """Raised when no usable speaker output is available."""

DEFAULT_WHISPER_BIN = "/home/ssafy/whisper.cpp/build/bin/whisper-cli"
DEFAULT_WHISPER_MODEL = "/home/ssafy/whisper.cpp/models/ggml-base.bin"
COMMON_STT_HALLUCINATIONS = {
    "감사합니다",
    "고맙습니다",
    "시청해주셔서 감사합니다",
    "시청해 주셔서 감사합니다",
}
COMMON_STT_HALLUCINATION_KEYS = {
    re.sub(r"[\s.?!,~…]+", "", item) for item in COMMON_STT_HALLUCINATIONS
}


def load_env_file(env_path):
    path = Path(env_path)
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def load_default_env_files(script_file):
    script_dir = Path(script_file).resolve().parent
    load_env_file(script_dir / ".env")
    load_env_file(Path.cwd() / ".env")


def require_command(command):
    if shutil.which(command):
        return
    raise RuntimeError(f"`{command}` 명령을 찾을 수 없습니다.")


def has_command(command):
    return shutil.which(command) is not None


def ensure_pipewire_runtime_env():
    if os.getenv("XDG_RUNTIME_DIR"):
        return
    runtime_dir = Path(f"/run/user/{os.getuid()}")
    if runtime_dir.exists():
        os.environ["XDG_RUNTIME_DIR"] = str(runtime_dir)


def pipewire_sink_available():
    if not has_command("wpctl"):
        return False
    ensure_pipewire_runtime_env()
    result = subprocess.run(["wpctl", "status"], text=True, capture_output=True, check=False)
    if result.returncode != 0:
        return False

    in_sinks = False
    for raw_line in result.stdout.splitlines():
        line = raw_line.strip()
        if line.startswith("├─ Sinks:") or line.startswith("|- Sinks:"):
            in_sinks = True
            continue
        if in_sinks and line.startswith(("├─", "└─", "|-", "`-")):
            return False
        if in_sinks and re.search(r"\d+\.\s+", line):
            return True
    return False


def has_python_module(module_name):
    return importlib.util.find_spec(module_name) is not None


def choose_alsa_device(command_name):
    if not has_command(command_name):
        return ""

    result = subprocess.run(
        [command_name, "-l"],
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        return ""

    matches = list(re.finditer(r"^card\s+(\d+):.*device\s+(\d+):.*$", result.stdout, re.MULTILINE))
    if not matches:
        return ""

    if command_name == "aplay":
        for match in matches:
            line = match.group(0).lower()
            if "usb" in line or "k66" in line:
                return f"plughw:{match.group(1)},{match.group(2)}"
        for match in matches:
            line = match.group(0).lower()
            if "hdmi" not in line and "vc4" not in line:
                return f"plughw:{match.group(1)},{match.group(2)}"
        return ""

    match = matches[0]
    return f"plughw:{match.group(1)},{match.group(2)}"


def record_wav(output_path, seconds, device):
    require_command("arecord")
    command = [
        "arecord",
        "-q",
        "-f",
        "S16_LE",
        "-r",
        "16000",
        "-c",
        "1",
        "-d",
        str(seconds),
    ]
    if device:
        command.extend(["-D", device])
    command.append(str(output_path))
    result = subprocess.run(command, text=True, capture_output=True)
    if result.returncode == 0:
        return

    detail = (result.stderr or result.stdout).strip()
    hint = (
        "마이크 입력 장치를 열 수 없습니다. `arecord -l`로 캡처 장치를 확인한 뒤 "
        "`python3 voice_chat.py --audio-device plughw:CARD,DEVICE` 형태로 지정하세요. "
        "예: `--audio-device plughw:2,0`"
    )
    raise RuntimeError(f"{hint}\narecord output:\n{detail}")


def pcm_rms(pcm_bytes):
    if not pcm_bytes:
        return 0
    samples = array.array("h")
    samples.frombytes(pcm_bytes)
    if sys.byteorder != "little":
        samples.byteswap()
    if not samples:
        return 0
    square_sum = sum(sample * sample for sample in samples)
    return math.sqrt(square_sum / len(samples))


def write_pcm_wav(output_path, pcm_chunks, sample_rate=16000):
    with wave.open(str(output_path), "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(b"".join(pcm_chunks))


def write_tone_wav(output_path, frequency=880, duration=0.18, volume=0.25, sample_rate=16000):
    sample_count = max(1, int(sample_rate * duration))
    peak = int(32767 * max(0, min(volume, 1)))
    samples = array.array("h")
    for index in range(sample_count):
        envelope = 1
        fade_samples = max(1, int(sample_rate * 0.02))
        if index < fade_samples:
            envelope = index / fade_samples
        elif sample_count - index < fade_samples:
            envelope = (sample_count - index) / fade_samples
        value = int(peak * envelope * math.sin(2 * math.pi * frequency * index / sample_rate))
        samples.append(value)
    if sys.byteorder != "little":
        samples.byteswap()
    write_pcm_wav(output_path, [samples.tobytes()], sample_rate=sample_rate)


def write_start_chime_wav(output_path, volume=0.25, sample_rate=16000):
    samples = array.array("h")
    peak = int(32767 * max(0, min(volume, 1)))
    tones = ((880, 0.08), (0, 0.025), (1320, 0.12))

    for frequency, duration in tones:
        sample_count = max(1, int(sample_rate * duration))
        fade_samples = max(1, int(sample_rate * 0.012))
        for index in range(sample_count):
            if frequency <= 0:
                samples.append(0)
                continue
            envelope = 1
            if index < fade_samples:
                envelope = index / fade_samples
            elif sample_count - index < fade_samples:
                envelope = (sample_count - index) / fade_samples
            value = int(peak * envelope * math.sin(2 * math.pi * frequency * index / sample_rate))
            samples.append(value)

    if sys.byteorder != "little":
        samples.byteswap()
    write_pcm_wav(output_path, [samples.tobytes()], sample_rate=sample_rate)


def play_start_sound(args):
    global START_SOUND_WARNING_SHOWN

    if getattr(args, "start_sound", "on") == "off":
        return
    start_sound_file = getattr(args, "start_sound_file", "")
    start_sound_player = getattr(args, "start_sound_player", "auto")
    aplay_bin = getattr(args, "aplay_bin", "aplay")
    command = None

    if start_sound_player in ("auto", "pw-play") and has_command("pw-play"):
        ensure_pipewire_runtime_env()
        command = ["pw-play"]
        start_sound_device = getattr(args, "start_sound_device", "")
        if start_sound_device:
            command.extend(["--target", start_sound_device])
    elif start_sound_player == "ffplay" and has_command("ffplay"):
        command = ["ffplay", "-nodisp", "-autoexit", "-loglevel", "error"]
    elif start_sound_player in ("auto", "aplay") and has_command(aplay_bin):
        command = [aplay_bin, "-q"]
        start_sound_device = getattr(args, "start_sound_device", "")
        if start_sound_device:
            command.extend(["-D", start_sound_device])

    if command is None:
        if not START_SOUND_WARNING_SHOWN:
            print("[sound] 시작 알림음을 재생할 수 있는 명령을 찾지 못해 건너뜁니다.", file=sys.stderr)
            START_SOUND_WARNING_SHOWN = True
        return

    with tempfile.TemporaryDirectory(prefix="rebloom_start_sound_") as temp_dir:
        sound_path = Path(start_sound_file).expanduser() if start_sound_file else None
        if sound_path is None:
            sound_path = Path(temp_dir) / "start.wav"
            write_start_chime_wav(sound_path)
        elif not sound_path.exists():
            if not START_SOUND_WARNING_SHOWN:
                print(f"[sound] 시작 알림음 파일을 찾지 못해 건너뜁니다: {sound_path}", file=sys.stderr)
                START_SOUND_WARNING_SHOWN = True
            return

        command.append(str(sound_path))
        result = None
        for attempt in range(3):
            result = subprocess.run(command, text=True, capture_output=True)
            detail = (result.stderr or result.stdout).strip()
            if result.returncode == 0:
                return
            if not is_audio_busy_detail(detail):
                break
            if attempt < 2:
                time.sleep(0.2)

        if result is None:
            return
        if result.returncode != 0:
            detail = (result.stderr or result.stdout).strip()
            if is_audio_busy_detail(detail):
                return
            if not START_SOUND_WARNING_SHOWN:
                print(f"[sound] 시작 알림음 재생을 건너뜁니다: {detail}", file=sys.stderr)
                print("[sound] 끄려면 `--start-sound off`, 출력 장치를 지정하려면 `--start-sound-device DEVICE`를 사용하세요.", file=sys.stderr)
                START_SOUND_WARNING_SHOWN = True


def is_audio_busy_detail(detail):
    lower_detail = detail.lower()
    return any(marker in lower_detail for marker in START_SOUND_BUSY_MARKERS)


def write_stt_submit_chime_wav(output_path, volume=0.25, sample_rate=16000):
    """STT 제출 효과음(내림조): 녹음 완료 후 처리 시작을 알린다."""
    samples = array.array("h")
    peak = int(32767 * max(0, min(volume, 1)))
    tones = ((1046, 0.07), (0, 0.02), (784, 0.10))

    for frequency, duration in tones:
        sample_count = max(1, int(sample_rate * duration))
        fade_samples = max(1, int(sample_rate * 0.012))
        for index in range(sample_count):
            if frequency <= 0:
                samples.append(0)
                continue
            envelope = 1
            if index < fade_samples:
                envelope = index / fade_samples
            elif sample_count - index < fade_samples:
                envelope = (sample_count - index) / fade_samples
            value = int(peak * envelope * math.sin(2 * math.pi * frequency * index / sample_rate))
            samples.append(value)

    if sys.byteorder != "little":
        samples.byteswap()
    write_pcm_wav(output_path, [samples.tobytes()], sample_rate=sample_rate)


def play_stt_sound(args):
    """녹음 완료 → STT 처리 시작 시점에 짧은 효과음을 재생한다."""
    global STT_SOUND_WARNING_SHOWN

    if getattr(args, "stt_sound", "on") == "off":
        return

    stt_sound_file = getattr(args, "stt_sound_file", "")
    start_sound_player = getattr(args, "start_sound_player", "auto")
    start_sound_device = getattr(args, "start_sound_device", "")
    aplay_bin = getattr(args, "aplay_bin", "aplay")
    command = None

    if start_sound_player in ("auto", "pw-play") and has_command("pw-play"):
        ensure_pipewire_runtime_env()
        command = ["pw-play"]
        if start_sound_device:
            command.extend(["--target", start_sound_device])
    elif start_sound_player == "ffplay" and has_command("ffplay"):
        command = ["ffplay", "-nodisp", "-autoexit", "-loglevel", "error"]
    elif start_sound_player in ("auto", "aplay") and has_command(aplay_bin):
        command = [aplay_bin, "-q"]
        if start_sound_device:
            command.extend(["-D", start_sound_device])

    if command is None:
        if not STT_SOUND_WARNING_SHOWN:
            print("[sound] STT 효과음을 재생할 수 있는 명령을 찾지 못해 건너뜁니다.", file=sys.stderr)
            STT_SOUND_WARNING_SHOWN = True
        return

    with tempfile.TemporaryDirectory(prefix="rebloom_stt_sound_") as temp_dir:
        sound_path = Path(stt_sound_file).expanduser() if stt_sound_file else None
        if sound_path is None:
            sound_path = Path(temp_dir) / "stt_submit.wav"
            write_stt_submit_chime_wav(sound_path)
        elif not sound_path.exists():
            if not STT_SOUND_WARNING_SHOWN:
                print(f"[sound] STT 효과음 파일을 찾지 못해 건너뜁니다: {sound_path}", file=sys.stderr)
                STT_SOUND_WARNING_SHOWN = True
            return

        command.append(str(sound_path))
        result = subprocess.run(command, text=True, capture_output=True, check=False)
        if result.returncode != 0:
            detail = (result.stderr or result.stdout).strip()
            if not is_audio_busy_detail(detail) and not STT_SOUND_WARNING_SHOWN:
                print(f"[sound] STT 효과음 재생 실패: {detail}", file=sys.stderr)
                STT_SOUND_WARNING_SHOWN = True


def record_wav_until_silence(
    output_path,
    device,
    max_seconds,
    silence_seconds,
    start_timeout,
    speech_threshold,
):
    require_command("arecord")
    sample_rate = 16000
    chunk_seconds = 0.1
    chunk_bytes = int(sample_rate * chunk_seconds * 2)
    silence_chunks = max(1, int(silence_seconds / chunk_seconds))
    max_chunks = max(1, int(max_seconds / chunk_seconds))
    start_timeout_chunks = max(1, int(start_timeout / chunk_seconds))

    command = [
        "arecord",
        "-q",
        "-f",
        "S16_LE",
        "-r",
        str(sample_rate),
        "-c",
        "1",
        "-t",
        "raw",
    ]
    if device:
        command.extend(["-D", device])

    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    chunks = []
    speech_started = False
    trailing_silence = 0

    try:
        for index in range(max_chunks):
            chunk = process.stdout.read(chunk_bytes) if process.stdout else b""
            if not chunk:
                break

            chunks.append(chunk)
            is_speech = pcm_rms(chunk) >= speech_threshold
            if is_speech:
                speech_started = True
                trailing_silence = 0
            elif speech_started:
                trailing_silence += 1

            if speech_started and trailing_silence >= silence_chunks:
                break
            if not speech_started and index + 1 >= start_timeout_chunks:
                break
    finally:
        process.terminate()
        try:
            process.wait(timeout=1)
        except subprocess.TimeoutExpired:
            process.kill()

    if not chunks:
        detail = process.stderr.read().decode("utf-8", errors="replace").strip() if process.stderr else ""
        raise RuntimeError(f"마이크 입력을 읽지 못했습니다.\narecord output:\n{detail}")

    if not speech_started:
        return False

    write_pcm_wav(output_path, chunks, sample_rate=sample_rate)
    return True


_SENT_END_PAT = re.compile(r'(?<=[.?!。？！])\s')


def iter_sentences(token_iter):
    """Buffer streaming LLM tokens and yield at sentence-ending punctuation boundaries."""
    buffer = ""
    for token in token_iter:
        buffer += token
        while True:
            m = _SENT_END_PAT.search(buffer)
            if not m:
                break
            sentence = buffer[:m.start() + 1].strip()
            buffer = buffer[m.end():]
            if sentence:
                yield sentence
    remainder = buffer.strip()
    if remainder:
        yield remainder


def clean_transcript(text):
    text = text.strip()
    text = re.sub(r"\[[^\]]+\]|\([^\)]+\)", " ", text)
    text = re.sub(r"<\|[^|]+\|>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip(" \t\r\n\"'`")


def is_meaningful_transcript(text):
    compact = re.sub(r"[\s.?!,~…]+", "", text)
    if not compact:
        return False
    if compact in COMMON_STT_HALLUCINATION_KEYS:
        return False
    return len(compact) >= 2


def clean_spoken_answer(text):
    text = text.strip()
    text = re.sub(r"```.*?```", " ", text, flags=re.DOTALL)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = re.sub(r"^\s*[-*]\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def transcribe_whisper_cpp(wav_path, whisper_bin, whisper_model, language, threads=4, fast=False):
    if not whisper_model:
        raise RuntimeError("whisper.cpp 모델 경로가 필요합니다. --whisper-model 값을 지정하세요.")
    require_command(whisper_bin)

    out_base = wav_path.with_suffix("")
    txt_path = out_base.with_suffix(".txt")
    if txt_path.exists():
        txt_path.unlink()

    command = [
        whisper_bin,
        "-m",
        whisper_model,
        "-f",
        str(wav_path),
        "-l",
        language,
        "-t",
        str(threads),
        "-otxt",
        "-of",
        str(out_base),
    ]
    if fast:
        command.extend(["--no-timestamps", "--beam-size", "1", "--best-of", "1"])
    subprocess.run(command, check=True, text=True, capture_output=True)

    if not txt_path.exists():
        raise RuntimeError(f"STT 결과 파일을 찾을 수 없습니다: {txt_path}")
    transcript = txt_path.read_text(encoding="utf-8").strip()
    txt_path.unlink(missing_ok=True)
    return transcript


def speak_espeak(text, voice):
    require_command("espeak-ng")
    subprocess.run(["espeak-ng", "-v", voice, text], check=True)


def speak_piper(text, piper_bin, piper_model, aplay_bin):
    if not piper_model:
        raise RuntimeError("Piper 모델 경로가 필요합니다. --piper-model 값을 지정하세요.")
    require_command(piper_bin)
    require_command(aplay_bin)

    with tempfile.TemporaryDirectory(prefix="rebloom_tts_") as temp_dir:
        wav_path = Path(temp_dir) / "answer.wav"
        command = [piper_bin, "--model", piper_model, "--output_file", str(wav_path)]
        subprocess.run(command, input=text.encode("utf-8"), check=True)
        subprocess.run([aplay_bin, "-q", str(wav_path)], check=True)


HF_TTS_PIPELINES = {}
MELOTTS_MODELS = {}


def _torch_dtype_from_name(dtype_name):
    if not dtype_name or dtype_name == "auto":
        return "auto"
    try:
        import torch
    except ImportError as exc:
        raise RuntimeError("Hugging Face TTS는 torch가 필요합니다. `python -m pip install torch transformers`를 실행하세요.") from exc

    dtype = getattr(torch, dtype_name, None)
    if dtype is None:
        raise RuntimeError(f"지원하지 않는 torch dtype입니다: {dtype_name}")
    return dtype


def _hf_device_arg(device):
    if not device or device == "cpu":
        return -1
    if device.startswith("cuda"):
        if ":" in device:
            return int(device.split(":", 1)[1])
        return 0
    return device


def _load_hf_tts_pipeline(model_id, device, torch_dtype):
    key = (model_id, device, torch_dtype)
    if key in HF_TTS_PIPELINES:
        return HF_TTS_PIPELINES[key]

    try:
        from transformers import pipeline
    except ImportError as exc:
        raise RuntimeError("Hugging Face TTS는 transformers가 필요합니다. `python -m pip install transformers torch`를 실행하세요.") from exc

    kwargs = {
        "model": model_id,
        "device": _hf_device_arg(device),
    }
    if torch_dtype:
        kwargs["torch_dtype"] = _torch_dtype_from_name(torch_dtype)
    try:
        pipe = pipeline("text-to-speech", **kwargs)
    except ValueError:
        kwargs["trust_remote_code"] = True
        pipe = pipeline("text-to-speech", **kwargs)
    HF_TTS_PIPELINES[key] = pipe
    return pipe


def _write_tts_audio_wav(output_path, audio, sample_rate):
    import numpy as np

    samples = np.asarray(audio)
    if samples.ndim > 1:
        samples = samples.squeeze()
    if samples.dtype.kind == "f":
        samples = np.clip(samples, -1.0, 1.0)
        samples = (samples * 32767).astype(np.int16)
    else:
        samples = samples.astype(np.int16)
    if sys.byteorder != "little":
        samples = samples.byteswap()
    write_pcm_wav(output_path, [samples.tobytes()], sample_rate=sample_rate)


def speak_huggingface_tts(text, model_id, device, torch_dtype, aplay_bin, tts_output_file=""):
    if not tts_output_file:
        require_command(aplay_bin)

    pipe = _load_hf_tts_pipeline(model_id, device, torch_dtype)
    result = pipe(text)
    audio = result.get("audio")
    sample_rate = int(result.get("sampling_rate", 16000))
    if audio is None:
        raise RuntimeError("Hugging Face TTS 결과에 audio가 없습니다.")

    with tempfile.TemporaryDirectory(prefix="rebloom_hf_tts_") as temp_dir:
        wav_path = Path(tts_output_file) if tts_output_file else Path(temp_dir) / "answer.wav"
        _write_tts_audio_wav(wav_path, audio, sample_rate)
        if tts_output_file:
            print(f"[tts] WAV 저장됨: {wav_path}")
            return
        subprocess.run([aplay_bin, "-q", str(wav_path)], check=True)


def _load_melotts_model(language, device):
    key = (language, device)
    if key in MELOTTS_MODELS:
        return MELOTTS_MODELS[key]

    try:
        from melo.api import TTS
    except ImportError as exc:
        raise RuntimeError("MeloTTS가 설치되어 있지 않습니다. `python -m pip install melotts`를 실행하세요.") from exc

    model = TTS(language=language, device=device)
    MELOTTS_MODELS[key] = model
    return model


def speak_melotts(text, language, speaker, speed, device, aplay_bin, tts_output_file=""):
    if not tts_output_file:
        require_command(aplay_bin)

    model = _load_melotts_model(language, device)
    speaker_ids = getattr(model.hps.data, "spk2id", {})
    if speaker not in speaker_ids:
        available = ", ".join(sorted(speaker_ids)) or "없음"
        raise RuntimeError(f"MeloTTS speaker를 찾지 못했습니다: {speaker}. 사용 가능: {available}")

    with tempfile.TemporaryDirectory(prefix="rebloom_melotts_") as temp_dir:
        wav_path = Path(tts_output_file) if tts_output_file else Path(temp_dir) / "answer.wav"
        model.tts_to_file(text, speaker_ids[speaker], str(wav_path), speed=speed)
        if tts_output_file:
            print(f"[tts] WAV 저장됨: {wav_path}")
            return
        subprocess.run([aplay_bin, "-q", str(wav_path)], check=True)


# ---- Edge TTS 감정 표현 (rate / pitch 조정) ----
# edge-tts 7.x 는 텍스트 입력 시 HTML 이스케이프를 적용하므로 SSML 직접 삽입 불가.
# rate(속도 %) 와 pitch(음높이 Hz) 를 감정에 맞게 조정해 자연스러운 표현을 구현.
# 각 항목: (정규식, rate_delta_pct: int, pitch_delta_hz: int)
_EDGE_EMOTION_RULES = [
    # 슬픔·위로: 느리고 낮은 톤
    (r"슬프|힘들어|울고|눈물|괜찮아\?|위로해|아파|걱정돼|미안해|상처|외로|속상", -12, -8),
    # 애정·칭찬: 부드럽고 약간 따뜻한 톤
    (r"사랑해|고마워|감사해|정말 좋아|아끼|소중|보고 싶|칭찬|자랑스러워", -5, 5),
    # 기쁨·활기: 빠르고 밝은 톤
    (r"신나|기뻐|너무 좋아|재미있|행복|즐거|웃음|대박|잘 했어|훌륭|멋있|최고", 12, 10),
    # 진지·중요: 느리고 낮은 톤
    (r"중요해|꼭 기억|반드시|조심해|위험|진심으로|정말로|절대|진지", -10, -6),
    # 격려·응원: 안정적이고 부드러운 톤
    (r"괜찮아|잘 할 수 있|걱정하지|천천히|응원|용기|할 수 있어|믿어|힘내", -8, 0),
]


def _parse_prosody_pct(s: str) -> int:
    """'+10%' → 10, '-5%' → -5"""
    return int(s.replace("%", "").lstrip("+"))


def _parse_prosody_hz(s: str) -> int:
    """'+5Hz' → 5, '-8Hz' → -8"""
    return int(s.replace("Hz", "").lstrip("+"))


def _fmt_prosody_pct(n: int) -> str:
    return f"+{n}%" if n >= 0 else f"{n}%"


def _fmt_prosody_hz(n: int) -> str:
    return f"+{n}Hz" if n >= 0 else f"{n}Hz"


def detect_edge_emotion(text):
    """텍스트에서 감정을 감지하고 (rate_delta_pct, pitch_delta_hz) 반환. 없으면 (0, 0)."""
    for pattern, rate_delta, pitch_delta in _EDGE_EMOTION_RULES:
        if re.search(pattern, text):
            return rate_delta, pitch_delta
    return 0, 0


async def save_edge_tts_mp3(text, output_path, voice, rate, volume, pitch="+0Hz"):
    try:
        import edge_tts
    except ImportError as exc:
        raise RuntimeError("Edge TTS가 설치되어 있지 않습니다. `python3 -m pip install --user edge-tts`를 실행하세요.") from exc

    communicate = edge_tts.Communicate(text, voice, rate=rate, volume=volume, pitch=pitch)
    await communicate.save(str(output_path))


def split_command_args(args_text):
    return args_text.split() if args_text else []


def speak_edge(
    text,
    edge_voice,
    edge_rate,
    edge_volume,
    mp3_player,
    mp3_player_args="",
    tts_output_file="",
    edge_pitch="+0Hz",
    edge_emotion_auto=False,
):
    if not tts_output_file:
        require_command(mp3_player)

    rate, pitch = edge_rate, edge_pitch
    if edge_emotion_auto:
        rate_delta, pitch_delta = detect_edge_emotion(text)
        if rate_delta or pitch_delta:
            rate = _fmt_prosody_pct(_parse_prosody_pct(edge_rate) + rate_delta)
            pitch = _fmt_prosody_hz(_parse_prosody_hz(edge_pitch) + pitch_delta)

    with tempfile.TemporaryDirectory(prefix="rebloom_edge_tts_") as temp_dir:
        mp3_path = Path(tts_output_file) if tts_output_file else Path(temp_dir) / "answer.mp3"
        asyncio.run(save_edge_tts_mp3(text, mp3_path, edge_voice, rate, edge_volume, pitch=pitch))
        if tts_output_file:
            print(f"[tts] MP3 저장됨: {mp3_path}")
            return
        play_mp3(mp3_path, mp3_player, mp3_player_args)


def play_mp3(mp3_path, mp3_player, mp3_player_args=""):
    if mp3_player == "aplay":
        play_mp3_via_aplay(mp3_path, mp3_player_args)
        return
    if mp3_player in {"pw-play", "pw-cat"}:
        play_mp3_via_pipewire(mp3_path, mp3_player, mp3_player_args)
        return

    command = build_mp3_player_command(mp3_path, mp3_player, mp3_player_args)
    try:
        subprocess.run(command, check=True)
        return
    except subprocess.CalledProcessError as exc:
        if exc.returncode != -signal.SIGSEGV:
            raise
        if mp3_player == "ffplay" or not has_command("ffplay"):
            raise
        print("[tts] mpg123가 비정상 종료되어 ffplay로 재생을 재시도합니다.", file=sys.stderr)

    subprocess.run(["ffplay", "-nodisp", "-autoexit", "-loglevel", "error", str(mp3_path)], check=True)


def build_mp3_player_command(mp3_path, mp3_player, mp3_player_args=""):
    args = split_command_args(mp3_player_args)
    if mp3_player == "mpg123":
        return [mp3_player, *args, "-q", str(mp3_path)]
    if mp3_player == "ffplay":
        if not args:
            args = ["-nodisp", "-autoexit", "-loglevel", "error"]
        return [mp3_player, *args, str(mp3_path)]
    return [mp3_player, *args, str(mp3_path)]


def play_mp3_via_aplay(mp3_path, mp3_player_args=""):
    require_command("ffmpeg")
    require_command("aplay")

    with tempfile.TemporaryDirectory(prefix="rebloom_mp3_wav_") as temp_dir:
        wav_path = Path(temp_dir) / "answer.wav"
        convert_mp3_to_wav(mp3_path, wav_path)
        play_wav_with_aplay(wav_path, mp3_player_args)


def play_mp3_via_pipewire(mp3_path, player, player_args=""):
    require_command("ffmpeg")
    require_command(player)
    ensure_pipewire_runtime_env()

    with tempfile.TemporaryDirectory(prefix="rebloom_mp3_wav_") as temp_dir:
        wav_path = Path(temp_dir) / "answer.wav"
        convert_mp3_to_wav(mp3_path, wav_path)
        subprocess.run([player, *split_command_args(player_args), str(wav_path)], check=True)


def convert_mp3_to_wav(mp3_path, wav_path):
    subprocess.run(
        [
            "ffmpeg",
            "-nostdin",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(mp3_path),
            "-ac",
            "2",
            "-ar",
            "44100",
            str(wav_path),
        ],
        check=True,
    )


def play_wav_with_aplay(wav_path, aplay_args_text=""):
    failures = []
    deadline = time.monotonic() + float(os.getenv("AUDIO_OUTPUT_WAIT_SECONDS", "30"))

    while True:
        candidates = aplay_arg_candidates(aplay_args_text)
        if not candidates:
            time.sleep(1.0)
            if time.monotonic() >= deadline:
                raise AudioOutputUnavailableError("재생 가능한 외부 오디오 출력 장치를 찾지 못했습니다.")
            continue

        for args in candidates:
            command = ["aplay", *args, "-q", str(wav_path)]
            result = subprocess.run(command, text=True, capture_output=True, check=False)
            if result.returncode == 0:
                return
            failures.append((command, (result.stderr or result.stdout).strip()))

        if time.monotonic() >= deadline:
            break
        time.sleep(1.0)

    detail = "\n".join(f"{' '.join(command)}\n{message}" for command, message in failures[-8:])
    raise AudioOutputUnavailableError(f"aplay로 오디오를 재생하지 못했습니다.\n{detail}")


def aplay_arg_candidates(args_text):
    candidates = []
    configured_args = split_command_args(args_text)
    if configured_args and args_text.strip().lower() != "auto":
        candidates.append(configured_args)

    selected = choose_alsa_device("aplay")
    if selected:
        candidates.append(["-D", selected])

    for device in playback_devices_from_dev_snd():
        candidates.append(["-D", device])

    if os.getenv("ALLOW_HDMI_AUDIO_FALLBACK", "false").strip().lower() in {"1", "true", "yes", "y", "on"}:
        candidates.append(["-D", "default"])
        candidates.append([])
    return dedupe_arg_lists(candidates)


def playback_devices_from_dev_snd():
    devices = []
    snd_dir = Path("/dev/snd")
    if not snd_dir.exists():
        return devices

    pattern = re.compile(r"pcmC(\d+)D(\d+)p$")
    for path in sorted(snd_dir.glob("pcmC*D*p")):
        match = pattern.match(path.name)
        if not match:
            continue
        card, device = match.groups()
        if int(card) < 2 and os.getenv("ALLOW_HDMI_AUDIO_FALLBACK", "false").strip().lower() not in {"1", "true", "yes", "y", "on"}:
            continue
        devices.append(f"plughw:{card},{device}")

    # Prefer likely external USB speakers over HDMI devices.
    return sorted(devices, key=lambda item: int(item.split(":", 1)[1].split(",", 1)[0]) < 2)


def dedupe_arg_lists(candidates):
    result = []
    seen = set()
    for args in candidates:
        key = tuple(args)
        if key in seen:
            continue
        seen.add(key)
        result.append(args)
    return result


def save_elevenlabs_tts_mp3(
    text,
    output_path,
    api_key,
    voice_id,
    model_id,
    output_format,
    voice_settings,
    timeout_seconds=30.0,
):
    if not api_key:
        raise RuntimeError("ElevenLabs API 키가 필요합니다. ELEVENLABS_API_KEY 값을 지정하세요.")
    if not voice_id:
        raise RuntimeError("ElevenLabs voice id가 필요합니다. ELEVENLABS_VOICE_ID 값을 지정하세요.")

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format={output_format}"
    payload = json_dumps_bytes(
        {
            "text": text,
            "model_id": model_id,
            "voice_settings": voice_settings,
        }
    )
    request = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
            "xi-api-key": api_key,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            Path(output_path).write_bytes(response.read())
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace").strip()
        raise RuntimeError(f"ElevenLabs TTS 요청 실패: HTTP {exc.code} {detail}") from exc


def json_dumps_bytes(value):
    import json

    return json.dumps(value, ensure_ascii=False).encode("utf-8")


def speak_elevenlabs(
    text,
    api_key,
    voice_id,
    model_id,
    output_format,
    stability,
    similarity_boost,
    style,
    use_speaker_boost,
    speed,
    mp3_player,
    mp3_player_args="",
    tts_output_file="",
    timeout_seconds=30.0,
):
    voice_settings = {
        "stability": stability,
        "similarity_boost": similarity_boost,
        "style": style,
        "use_speaker_boost": use_speaker_boost,
        "speed": speed,
    }

    # 전체 다운로드 없이 즉시 재생 시작 (ffplay로 스트리밍)
    if not tts_output_file and has_command("ffplay"):
        _speak_elevenlabs_stream(text, api_key, voice_id, model_id, output_format, voice_settings, timeout_seconds)
        return

    if not tts_output_file:
        require_command(mp3_player)

    with tempfile.TemporaryDirectory(prefix="rebloom_elevenlabs_tts_") as temp_dir:
        mp3_path = Path(tts_output_file) if tts_output_file else Path(temp_dir) / "answer.mp3"
        save_elevenlabs_tts_mp3(
            text, mp3_path, api_key, voice_id, model_id, output_format, voice_settings, timeout_seconds,
        )
        if tts_output_file:
            print(f"[tts] MP3 저장됨: {mp3_path}")
            return
        play_mp3(mp3_path, mp3_player, mp3_player_args)


def _speak_elevenlabs_stream(text, api_key, voice_id, model_id, output_format, voice_settings, timeout_seconds):
    """ElevenLabs /stream 엔드포인트에서 받은 MP3를 ffplay로 즉시 재생한다."""
    ensure_pipewire_runtime_env()
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream?output_format={output_format}"
    payload = json_dumps_bytes({"text": text, "model_id": model_id, "voice_settings": voice_settings})
    request = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json", "Accept": "audio/mpeg", "xi-api-key": api_key},
        method="POST",
    )
    proc = subprocess.Popen(
        ["ffplay", "-nodisp", "-autoexit", "-loglevel", "error", "-i", "pipe:0"],
        stdin=subprocess.PIPE,
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            while True:
                chunk = response.read(8192)
                if not chunk:
                    break
                proc.stdin.write(chunk)
    except urllib.error.HTTPError as exc:
        proc.kill()
        detail = exc.read().decode("utf-8", errors="replace").strip()
        raise RuntimeError(f"ElevenLabs TTS 요청 실패: HTTP {exc.code} {detail}") from exc
    finally:
        try:
            proc.stdin.close()
        except BrokenPipeError:
            pass
        proc.wait()


def list_edge_voices():
    try:
        import edge_tts
    except ImportError as exc:
        raise RuntimeError("Edge TTS가 설치되어 있지 않습니다. `python3 -m pip install --user edge-tts`를 실행하세요.") from exc

    async def _list_voices():
        voices = await edge_tts.list_voices()
        for voice in voices:
            short_name = voice.get("ShortName", "")
            locale = voice.get("Locale", "")
            gender = voice.get("Gender", "")
            if locale == "ko-KR":
                print(f"{short_name}\t{gender}")

    asyncio.run(_list_voices())


def speak(text, args):
    if args.tts == "none":
        return
    if args.tts == "auto":
        if has_python_module("edge_tts") and has_command(args.mp3_player):
            speak_edge(
                text,
                args.edge_voice,
                args.edge_rate,
                args.edge_volume,
                args.mp3_player,
                args.mp3_player_args,
                args.tts_output_file,
                edge_pitch=getattr(args, "edge_pitch", "+0Hz"),
                edge_emotion_auto=getattr(args, "edge_emotion_auto", False),
            )
            return
        if args.piper_model and has_command(args.piper_bin) and has_command(args.aplay_bin):
            speak_piper(text, args.piper_bin, args.piper_model, args.aplay_bin)
            return
        if has_command("espeak-ng"):
            speak_espeak(text, args.espeak_voice)
            return
        print("[tts] 사용 가능한 TTS 엔진이 없습니다. Edge TTS, Piper, espeak-ng 중 하나를 설치하세요.", file=sys.stderr)
        return
    if args.tts == "espeak":
        speak_espeak(text, args.espeak_voice)
        return
    if args.tts == "piper":
        speak_piper(text, args.piper_bin, args.piper_model, args.aplay_bin)
        return
    if args.tts in ("huggingface", "hf", "hf_melotts", "melotts"):
        if args.tts == "melotts":
            speak_melotts(
                text,
                args.melotts_language,
                args.melotts_speaker,
                args.melotts_speed,
                args.hf_tts_device,
                args.aplay_bin,
                args.tts_output_file,
            )
            return
        speak_huggingface_tts(
            text,
            args.hf_tts_model,
            args.hf_tts_device,
            args.hf_tts_torch_dtype,
            args.aplay_bin,
            args.tts_output_file,
        )
        return
    if args.tts == "edge":
        speak_edge(
            text,
            args.edge_voice,
            args.edge_rate,
            args.edge_volume,
            args.mp3_player,
            args.mp3_player_args,
            args.tts_output_file,
            edge_pitch=getattr(args, "edge_pitch", "+0Hz"),
            edge_emotion_auto=getattr(args, "edge_emotion_auto", False),
        )
        return
    if args.tts == "elevenlabs":
        speak_elevenlabs(
            text,
            args.elevenlabs_api_key,
            args.elevenlabs_voice_id,
            args.elevenlabs_model_id,
            args.elevenlabs_output_format,
            args.elevenlabs_stability,
            args.elevenlabs_similarity_boost,
            args.elevenlabs_style,
            args.elevenlabs_use_speaker_boost,
            args.elevenlabs_speed,
            args.mp3_player,
            args.mp3_player_args,
            args.tts_output_file,
            args.elevenlabs_timeout_seconds,
        )
        return
    raise RuntimeError(f"지원하지 않는 TTS 엔진입니다: {args.tts}")
