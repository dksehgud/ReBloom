import argparse
import os
import subprocess
import sys
import tempfile
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

try:
    from etc.voice_runtime import (
        DEFAULT_WHISPER_BIN,
        DEFAULT_WHISPER_MODEL,
        choose_alsa_device,
        clean_spoken_answer,
        clean_transcript,
        has_command,
        has_python_module,
        is_meaningful_transcript,
        list_edge_voices,
        load_default_env_files as _load_default_env_files,
        load_env_file,
        play_start_sound,
        record_wav,
        record_wav_until_silence,
        require_command,
        save_edge_tts_mp3,
        speak,
        speak_edge,
        speak_espeak,
        speak_piper,
        transcribe_whisper_cpp,
        write_tone_wav,
    )
except ModuleNotFoundError as exc:
    if exc.name != "etc":
        raise
    if not __package__:
        raise
    from .etc.voice_runtime import (
        DEFAULT_WHISPER_BIN,
        DEFAULT_WHISPER_MODEL,
        choose_alsa_device,
        clean_spoken_answer,
        clean_transcript,
        has_command,
        has_python_module,
        is_meaningful_transcript,
        list_edge_voices,
        load_default_env_files as _load_default_env_files,
        load_env_file,
        play_start_sound,
        record_wav,
        record_wav_until_silence,
        require_command,
        save_edge_tts_mp3,
        speak,
        speak_edge,
        speak_espeak,
        speak_piper,
        transcribe_whisper_cpp,
        write_tone_wav,
    )

try:
    from llm_client import (
        DEFAULT_HOST,
        DEFAULT_MODEL,
        SYSTEM_PROMPT,
        post_chat,
        trim_messages,
    )
    from session_events import DEFAULT_SESSION_WINDOW_SECONDS, SessionEventSender
except ModuleNotFoundError as exc:
    if exc.name not in {"llm_client", "session_events"}:
        raise
    if not __package__:
        raise
    from .llm_client import (
        DEFAULT_HOST,
        DEFAULT_MODEL,
        SYSTEM_PROMPT,
        post_chat,
        trim_messages,
    )
    from .session_events import DEFAULT_SESSION_WINDOW_SECONDS, SessionEventSender


NO_INPUT_PROMPT = "잘 못 들었어요. 다시 한 번 말해 주세요."


def load_default_env_files():
    _load_default_env_files(__file__)


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
        "--wake-mode",
        choices=["on", "off"],
        default="on",
        help=argparse.SUPPRESS,
    )
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
                    sys.exit(20)
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
