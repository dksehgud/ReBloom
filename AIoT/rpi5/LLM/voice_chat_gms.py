import argparse
import http.client
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

from llm_client import SYSTEM_PROMPT, trim_messages
from voice_chat import listen_once, list_edge_voices, speak


DEFAULT_GMS_URL = "https://gms.ssafy.io/gmsapi/api.openai.com/v1/chat/completions"
DEFAULT_GMS_MODEL = "gpt-5-mini"


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


def to_gms_messages(messages):
    converted = []
    for message in messages:
        role = message["role"]
        if role == "system":
            role = "developer"
        converted.append({"role": role, "content": message["content"]})
    return converted


def post_gms_chat(api_url, api_key, model, messages, timeout=120):
    if not api_key:
        raise RuntimeError("GMS_KEY 환경변수가 필요합니다. `export GMS_KEY=...`로 등록하세요.")

    payload = {
        "model": model,
        "messages": to_gms_messages(messages),
    }
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        api_url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    last_error = None
    for _ in range(2):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                body = read_response_body(response)
            return parse_gms_content(body)
        except http.client.IncompleteRead as exc:
            last_error = exc
            partial_body = exc.partial.decode("utf-8", errors="replace")
            try:
                return parse_gms_content(partial_body)
            except (json.JSONDecodeError, KeyError, IndexError):
                continue
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"GMS API 요청 실패: HTTP {exc.code}\n{detail}") from exc
        except urllib.error.URLError as exc:
            raise RuntimeError("GMS API에 연결할 수 없습니다. 네트워크와 GMS_KEY를 확인하세요.") from exc

    raise RuntimeError(f"GMS API 응답을 끝까지 읽지 못했습니다: {last_error}") from last_error


def read_response_body(response):
    return response.read().decode("utf-8")


def parse_gms_content(body):
    try:
        result = json.loads(body)
        return result["choices"][0]["message"]["content"].strip()
    except json.JSONDecodeError:
        content_match = re.search(r'"content"\s*:\s*("(?:(?:\\.)|[^"\\])*")', body)
        if not content_match:
            raise
        return json.loads(content_match.group(1)).strip()


def build_parser():
    load_default_env_files()

    parser = argparse.ArgumentParser(description="Re:Bloom GMS voice chat pipeline")
    parser.add_argument("--gms-model", default=os.getenv("REBLOOM_GMS_MODEL", DEFAULT_GMS_MODEL))
    parser.add_argument("--gms-url", default=os.getenv("REBLOOM_GMS_URL", DEFAULT_GMS_URL))
    parser.add_argument("--gms-key", default=os.getenv("GMS_KEY", ""))
    parser.add_argument("--record-seconds", type=int, default=5)
    parser.add_argument("--listen-mode", choices=["vad", "fixed"], default=os.getenv("REBLOOM_LISTEN_MODE", "vad"))
    parser.add_argument("--max-record-seconds", type=float, default=20)
    parser.add_argument("--silence-seconds", type=float, default=1.2)
    parser.add_argument("--start-timeout", type=float, default=8)
    parser.add_argument("--speech-threshold", type=float, default=500)
    parser.add_argument("--audio-device", default=os.getenv("REBLOOM_AUDIO_DEVICE", "plughw:3,0"))
    parser.add_argument("--language", default="ko")
    parser.add_argument("--whisper-bin", default=os.getenv("REBLOOM_WHISPER_BIN", "whisper-cli"))
    parser.add_argument("--whisper-model", default=os.getenv("REBLOOM_WHISPER_MODEL", ""))
    parser.add_argument("--whisper-threads", type=int, default=int(os.getenv("REBLOOM_WHISPER_THREADS", "4")))
    parser.add_argument("--whisper-fast", action="store_true", default=os.getenv("REBLOOM_WHISPER_FAST", "") == "1")
    parser.add_argument(
        "--tts",
        choices=["auto", "none", "edge", "espeak", "piper"],
        default=os.getenv("REBLOOM_TTS", "auto"),
    )
    parser.add_argument("--tts-text", help="STT/GMS 없이 지정한 문장만 TTS로 재생합니다.")
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
        help="aplay 시작 알림음 출력 장치입니다. 예: plughw:3,0",
    )
    parser.add_argument(
        "--start-sound-player",
        choices=["auto", "ffplay", "aplay"],
        default=os.getenv("REBLOOM_START_SOUND_PLAYER", "auto"),
        help="시작 알림음 재생기입니다. auto는 ffplay를 우선 사용합니다.",
    )
    parser.add_argument("--once", action="store_true")
    parser.add_argument("--stt-only", action="store_true", help="녹음과 STT만 실행하고 인식 결과를 출력합니다.")
    parser.add_argument("--text", help="마이크 대신 텍스트 입력으로 GMS 파이프라인을 테스트합니다.")
    return parser


def main():
    args = build_parser().parse_args()
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    if args.list_edge_voices:
        list_edge_voices()
        return

    if args.tts_text:
        speak(args.tts_text, args)
        return

    print("Re:Bloom GMS voice chat. Ctrl+C로 종료.")
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

            print("[gms] 답변 생성 중...")
            answer = post_gms_chat(args.gms_url, args.gms_key, args.gms_model, messages)
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
