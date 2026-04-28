# whisper.cpp 기반 음성 인식 기능 -> qwen2 기반 음성 인식으로 변경

import argparse
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from llm_client import DEFAULT_HOST, DEFAULT_MODEL, SYSTEM_PROMPT, post_chat, trim_messages


def require_command(command):
    if shutil.which(command):
        return
    raise RuntimeError(f"`{command}` 명령을 찾을 수 없습니다.")


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


def transcribe_whisper_cpp(wav_path, whisper_bin, whisper_model, language):
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
        "-otxt",
        "-of",
        str(out_base),
    ]
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


def speak(text, args):
    if args.tts == "none":
        return
    if args.tts == "espeak":
        speak_espeak(text, args.espeak_voice)
        return
    if args.tts == "piper":
        speak_piper(text, args.piper_bin, args.piper_model, args.aplay_bin)
        return
    raise RuntimeError(f"지원하지 않는 TTS 엔진입니다: {args.tts}")


def listen_once(args):
    with tempfile.TemporaryDirectory(prefix="rebloom_voice_") as temp_dir:
        wav_path = Path(temp_dir) / "user.wav"
        if not args.stt_only:
            print(f"\n[record] {args.record_seconds}초 동안 말해주세요...")
        record_wav(wav_path, args.record_seconds, args.audio_device)
        if not args.stt_only:
            print("[stt] 음성을 텍스트로 변환 중...")
        return transcribe_whisper_cpp(
            wav_path,
            args.whisper_bin,
            args.whisper_model,
            args.language,
        )


def build_parser():
    parser = argparse.ArgumentParser(description="Re:Bloom local voice chat pipeline")
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--record-seconds", type=int, default=5)
    parser.add_argument("--audio-device", default=os.getenv("REBLOOM_AUDIO_DEVICE", "plughw:2,0"))
    parser.add_argument("--language", default="ko")
    parser.add_argument("--whisper-bin", default=os.getenv("REBLOOM_WHISPER_BIN", "whisper-cli"))
    parser.add_argument("--whisper-model", default=os.getenv("REBLOOM_WHISPER_MODEL", ""))
    parser.add_argument("--tts", choices=["none", "espeak", "piper"], default="espeak")
    parser.add_argument("--espeak-voice", default="ko")
    parser.add_argument("--piper-bin", default=os.getenv("REBLOOM_PIPER_BIN", "piper"))
    parser.add_argument("--piper-model", default=os.getenv("REBLOOM_PIPER_MODEL", ""))
    parser.add_argument("--aplay-bin", default="aplay")
    parser.add_argument("--once", action="store_true")
    parser.add_argument("--stt-only", action="store_true", help="녹음과 STT만 실행하고 인식 결과를 출력합니다.")
    parser.add_argument("--text", help="마이크 대신 텍스트 입력으로 파이프라인을 테스트합니다.")
    return parser


def main():
    args = build_parser().parse_args()
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    if not args.stt_only:
        print("Re:Bloom voice chat. Ctrl+C로 종료.")
    while True:
        try:
            user_text = args.text if args.text else listen_once(args)
            user_text = user_text.strip()
            if args.stt_only:
                print(user_text if user_text else "인식된 문장이 없습니다.")
                return

            if not user_text:
                print("[stt] 인식된 문장이 없습니다.")
                if args.once or args.text:
                    return
                continue

            print(f"You> {user_text}")
            messages.append({"role": "user", "content": user_text})

            print("[llm] 답변 생성 중...")
            answer = post_chat(args.host, args.model, messages)
            print(f"Re:Bloom> {answer}")
            messages.append({"role": "assistant", "content": answer})
            messages = trim_messages(messages)

            speak(answer, args)

            if args.once or args.text:
                return
        except KeyboardInterrupt:
            print()
            return
        except (RuntimeError, subprocess.CalledProcessError) as exc:
            print(f"Error: {exc}", file=sys.stderr)
            sys.exit(1)


if __name__ == "__main__":
    main()
