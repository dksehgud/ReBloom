import array
import asyncio
import importlib.util
import math
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
import wave
from pathlib import Path


START_SOUND_WARNING_SHOWN = False
START_SOUND_BUSY_MARKERS = (
    "device or resource busy",
    "resource busy",
    "장치나 자원이 동작 중",
)

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

    if start_sound_player in ("auto", "ffplay") and has_command("ffplay"):
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


async def save_edge_tts_mp3(text, output_path, voice, rate, volume):
    try:
        import edge_tts
    except ImportError as exc:
        raise RuntimeError("Edge TTS가 설치되어 있지 않습니다. `python3 -m pip install --user edge-tts`를 실행하세요.") from exc

    communicate = edge_tts.Communicate(text, voice, rate=rate, volume=volume)
    await communicate.save(str(output_path))


def split_command_args(args_text):
    return args_text.split() if args_text else []


def speak_edge(text, edge_voice, edge_rate, edge_volume, mp3_player, mp3_player_args="", tts_output_file=""):
    if not tts_output_file:
        require_command(mp3_player)

    with tempfile.TemporaryDirectory(prefix="rebloom_edge_tts_") as temp_dir:
        mp3_path = Path(tts_output_file) if tts_output_file else Path(temp_dir) / "answer.mp3"
        asyncio.run(save_edge_tts_mp3(text, mp3_path, edge_voice, edge_rate, edge_volume))
        if tts_output_file:
            print(f"[tts] MP3 저장됨: {mp3_path}")
            return
        subprocess.run([mp3_player, *split_command_args(mp3_player_args), "-q", str(mp3_path)], check=True)


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
    if not tts_output_file:
        require_command(mp3_player)

    with tempfile.TemporaryDirectory(prefix="rebloom_elevenlabs_tts_") as temp_dir:
        mp3_path = Path(tts_output_file) if tts_output_file else Path(temp_dir) / "answer.mp3"
        save_elevenlabs_tts_mp3(
            text,
            mp3_path,
            api_key,
            voice_id,
            model_id,
            output_format,
            {
                "stability": stability,
                "similarity_boost": similarity_boost,
                "style": style,
                "use_speaker_boost": use_speaker_boost,
                "speed": speed,
            },
            timeout_seconds,
        )
        if tts_output_file:
            print(f"[tts] MP3 저장됨: {mp3_path}")
            return
        subprocess.run([mp3_player, *split_command_args(mp3_player_args), "-q", str(mp3_path)], check=True)


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
