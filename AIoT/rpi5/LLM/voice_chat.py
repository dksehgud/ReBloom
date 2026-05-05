import argparse
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
import wave
from pathlib import Path

from llm_client import (
    DEFAULT_HOST,
    DEFAULT_MODEL,
    SYSTEM_PROMPT,
    post_chat,
    trim_messages,
)
from session_events import DEFAULT_SESSION_WINDOW_SECONDS, SessionEventSender


_START_SOUND_WARNING_SHOWN = False

NO_INPUT_PROMPT = "잘 못 들었어요. 다시 한 번 말해 주세요."
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


def load_default_env_files():
    script_dir = Path(__file__).resolve().parent
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


def play_start_sound(args):
    global _START_SOUND_WARNING_SHOWN

    if getattr(args, "start_sound", "on") == "off":
        return
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
        if not _START_SOUND_WARNING_SHOWN:
            print("[sound] 시작 알림음을 재생할 수 있는 명령을 찾지 못해 건너뜁니다.", file=sys.stderr)
            _START_SOUND_WARNING_SHOWN = True
        return

    with tempfile.TemporaryDirectory(prefix="rebloom_start_sound_") as temp_dir:
        wav_path = Path(temp_dir) / "start.wav"
        write_tone_wav(wav_path)
        command.append(str(wav_path))
        result = subprocess.run(command, text=True, capture_output=True)
        if result.returncode != 0:
            detail = (result.stderr or result.stdout).strip()
            if not _START_SOUND_WARNING_SHOWN:
                print(f"[sound] 시작 알림음 재생을 건너뜁니다: {detail}", file=sys.stderr)
                print("[sound] 끄려면 `--start-sound off`, 출력 장치를 지정하려면 `--start-sound-device DEVICE`를 사용하세요.", file=sys.stderr)
                _START_SOUND_WARNING_SHOWN = True


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
    subprocess.run(command, check=True)

    if not txt_path.exists():
        raise RuntimeError(f"STT 결과 파일을 찾을 수 없습니다: {txt_path}")
    return txt_path.read_text(encoding="utf-8").strip()


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
    raise RuntimeError(f"지원하지 않는 TTS 엔진입니다: {args.tts}")


def listen_once(args):
    with tempfile.TemporaryDirectory(prefix="rebloom_voice_") as temp_dir:
        wav_path = Path(temp_dir) / "user.wav"
        if not args.stt_only:
            play_start_sound(args)
            if args.listen_mode == "vad":
                print("\n[record] 말씀하시면 듣고, 조용해지면 자동으로 답변할게요...")
            else:
                print(f"\n[record] {args.record_seconds}초 동안 말해주세요...")
        if args.listen_mode == "vad":
            speech_detected = record_wav_until_silence(
                wav_path,
                args.audio_device,
                args.max_record_seconds,
                args.silence_seconds,
                args.start_timeout,
                args.speech_threshold,
            )
            if not speech_detected:
                return ""
        else:
            record_wav(wav_path, args.record_seconds, args.audio_device)
        if not args.stt_only:
            print("[stt] 음성을 텍스트로 변환 중...")
        transcript = transcribe_whisper_cpp(
            wav_path,
            args.whisper_bin,
            args.whisper_model,
            args.language,
            args.whisper_threads,
            args.whisper_fast,
        )
        return clean_transcript(transcript)


def build_parser():
    load_default_env_files()

    parser = argparse.ArgumentParser(description="Re:Bloom local voice chat pipeline")
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--record-seconds", type=int, default=5)
    parser.add_argument("--listen-mode", choices=["vad", "fixed"], default=os.getenv("REBLOOM_LISTEN_MODE", "vad"))
    parser.add_argument("--max-record-seconds", type=float, default=20)
    parser.add_argument("--silence-seconds", type=float, default=1.2)
    parser.add_argument("--start-timeout", type=float, default=8)
    parser.add_argument("--speech-threshold", type=float, default=500)
    parser.add_argument("--audio-device", default=os.getenv("REBLOOM_AUDIO_DEVICE", "plughw:2,0"))
    parser.add_argument("--language", default="ko")
    parser.add_argument("--whisper-bin", default=os.getenv("REBLOOM_WHISPER_BIN", DEFAULT_WHISPER_BIN))
    parser.add_argument("--whisper-model", default=os.getenv("REBLOOM_WHISPER_MODEL", DEFAULT_WHISPER_MODEL))
    parser.add_argument("--whisper-threads", type=int, default=int(os.getenv("REBLOOM_WHISPER_THREADS", "4")))
    parser.add_argument("--whisper-fast", action="store_true", default=os.getenv("REBLOOM_WHISPER_FAST", "") == "1")
    parser.add_argument(
        "--tts",
        choices=["auto", "none", "edge", "espeak", "piper"],
        default=os.getenv("REBLOOM_TTS", "auto"),
    )
    parser.add_argument("--tts-text", help="STT/LLM 없이 지정한 문장만 TTS로 재생합니다.")
    parser.add_argument("--list-edge-voices", action="store_true", help="사용 가능한 한국어 Edge TTS 음성을 출력합니다.")
    parser.add_argument("--edge-voice", default=os.getenv("REBLOOM_EDGE_VOICE", "ko-KR-SunHiNeural"))
    parser.add_argument("--edge-rate", default=os.getenv("REBLOOM_EDGE_RATE", "+0%"))
    parser.add_argument("--edge-volume", default=os.getenv("REBLOOM_EDGE_VOLUME", "+0%"))
    parser.add_argument("--mp3-player", default=os.getenv("REBLOOM_MP3_PLAYER", "mpg123"))
    parser.add_argument("--mp3-player-args", default=os.getenv("REBLOOM_MP3_PLAYER_ARGS", ""))
    parser.add_argument("--tts-output-file", default="", help="TTS 결과를 재생하지 않고 MP3 파일로 저장합니다.")
    parser.add_argument("--espeak-voice", default="ko")
    parser.add_argument("--piper-bin", default=os.getenv("REBLOOM_PIPER_BIN", "piper"))
    parser.add_argument("--piper-model", default=os.getenv("REBLOOM_PIPER_MODEL", ""))
    parser.add_argument("--aplay-bin", default="aplay")
    parser.add_argument(
        "--start-sound",
        choices=["on", "off"],
        default=os.getenv("REBLOOM_START_SOUND", "on"),
        help="녹음 시작 전에 짧은 알림음을 재생합니다.",
    )
    parser.add_argument(
        "--start-sound-device",
        default=os.getenv("REBLOOM_START_SOUND_DEVICE", ""),
        help="aplay 시작 알림음 출력 장치입니다. 예: plughw:2,0",
    )
    parser.add_argument(
        "--start-sound-player",
        choices=["auto", "ffplay", "aplay"],
        default=os.getenv("REBLOOM_START_SOUND_PLAYER", "auto"),
        help="시작 알림음 재생기입니다. auto는 ffplay를 우선 사용합니다.",
    )
    parser.add_argument("--once", action="store_true")
    parser.add_argument("--stt-only", action="store_true", help="녹음과 STT만 실행하고 인식 결과를 출력합니다.")
    parser.add_argument("--text", help="마이크 대신 텍스트 입력으로 파이프라인을 테스트합니다.")
    parser.add_argument(
        "--session-events-url",
        default=os.getenv("REBLOOM_SESSION_EVENTS_URL", ""),
        help="5분 단위 원본 대화 이벤트를 POST할 URL입니다. 비어 있으면 전송하지 않습니다.",
    )
    parser.add_argument(
        "--session-device-id",
        default=os.getenv("REBLOOM_DEVICE_ID", ""),
        help="세션 이벤트 JSON에 넣을 device_id입니다. 비어 있으면 hostname을 사용합니다.",
    )
    parser.add_argument(
        "--session-window-seconds",
        type=float,
        default=float(os.getenv("REBLOOM_SESSION_WINDOW_SECONDS", DEFAULT_SESSION_WINDOW_SECONDS)),
        help="대화 이벤트 전송 주기입니다. Default: 300",
    )
    parser.add_argument(
        "--session-send-timeout",
        type=float,
        default=float(os.getenv("REBLOOM_SESSION_SEND_TIMEOUT", "5")),
        help="세션 이벤트 POST timeout 초입니다. Default: 5",
    )
    parser.add_argument(
        "--redact-console",
        action=argparse.BooleanOptionalAction,
        default=os.getenv("REBLOOM_REDACT_CONSOLE", "0") == "1",
        help="콘솔/systemd 로그에 사용자 발화와 답변 원문을 남기지 않습니다.",
    )
    parser.add_argument(
        "--reprompt-on-empty",
        action=argparse.BooleanOptionalAction,
        default=os.getenv("REBLOOM_REPROMPT_ON_EMPTY", "1") != "0",
        help="음성이 없거나 STT 환각으로 보이는 입력이면 짧게 다시 말해 달라고 안내합니다.",
    )
    return parser


def main():
    args = build_parser().parse_args()
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    session_sender = SessionEventSender(
        url=args.session_events_url,
        device_id=args.session_device_id,
        window_seconds=args.session_window_seconds,
        timeout=args.session_send_timeout,
    )

    if args.list_edge_voices:
        list_edge_voices()
        return

    if args.tts_text:
        speak(args.tts_text, args)
        return

    if not args.stt_only:
        print("Re:Bloom voice chat. Ctrl+C로 종료.")
    while True:
        try:
            user_text = clean_transcript(args.text if args.text else listen_once(args))
            if args.stt_only:
                print(user_text if user_text else "인식된 문장이 없습니다.")
                return

            if not is_meaningful_transcript(user_text):
                print("[stt] 인식된 문장이 없습니다.")
                if args.reprompt_on_empty and not args.text:
                    print(f"Re:Bloom> {NO_INPUT_PROMPT}")
                    speak(NO_INPUT_PROMPT, args)
                if args.once or args.text:
                    return
                continue

            print("You> [redacted]" if args.redact_console else f"You> {user_text}")
            messages.append({"role": "user", "content": user_text})
            session_sender.append("user", user_text)

            print("[llm] 답변 생성 중...")
            answer = clean_spoken_answer(post_chat(args.host, args.model, messages))
            print("Re:Bloom> [redacted]" if args.redact_console else f"Re:Bloom> {answer}")
            messages.append({"role": "assistant", "content": answer})
            session_sender.append("assistant", answer)
            messages = trim_messages(messages)

            speak(answer, args)
            if not session_sender.flush_if_due():
                print(
                    "[session] 대화 이벤트 전송 실패: "
                    f"{session_sender.last_error}. 메모리에 보관 후 다음 주기에 재시도합니다.",
                    file=sys.stderr,
                )

            if args.once or args.text:
                if not session_sender.flush(force=True):
                    print(
                        "[session] 대화 이벤트 전송 실패: "
                        f"{session_sender.last_error}. 파일 로그는 남기지 않고 종료합니다.",
                        file=sys.stderr,
                    )
                return
        except KeyboardInterrupt:
            print()
            if not session_sender.flush(force=True):
                print(
                    "[session] 대화 이벤트 전송 실패: "
                    f"{session_sender.last_error}. 파일 로그는 남기지 않고 종료합니다.",
                    file=sys.stderr,
                )
            return
        except (RuntimeError, subprocess.CalledProcessError) as exc:
            print(f"Error: {exc}", file=sys.stderr)
            sys.exit(1)


if __name__ == "__main__":
    main()
