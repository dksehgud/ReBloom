"""
프로비저닝용 오프라인 안내 음성을 ElevenLabs로 생성합니다.
생성된 MP3는 boot_manager.py가 오프라인에서 재생하는 캐시 파일로 사용됩니다.

실행:
    source ../venv/bin/activate
    python generate_provisioning_audio.py
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from elevenlabs import ElevenLabs, VoiceSettings
from elevenlabs.play import save

load_dotenv()

API_KEY = os.getenv("ELEVENLABS_API_KEY")
if not API_KEY:
    raise ValueError(".env 파일에 ELEVENLABS_API_KEY를 설정해주세요.")

VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID")
if not VOICE_ID:
    raise ValueError(".env 파일에 ELEVENLABS_VOICE_ID를 설정해주세요.")

client = ElevenLabs(api_key=API_KEY)

VOICE_SETTINGS = VoiceSettings(
    stability=0.28,
    similarity_boost=0.82,
    style=0.50,
    use_speaker_boost=True,
    speed=1.0,
)

MUSIC_DIR = Path(__file__).resolve().parents[1] / "serverchatting" / "music"

# boot_manager.py의 프롬프트와 동일하게 맞춤
PROMPTS = {
    "no_wifi_prompt_edge.mp3": "와이파이 연결이 안되어 있어요. 앱에서 연결 연동을 해주세요.",
    "ready_prompt.mp3":        "만나서 반가워요. 우리 재미있는 대화를 나눠요!",
}


def generate(filename: str, text: str) -> None:
    out_path = MUSIC_DIR / filename
    print(f"생성 중: {text}")
    audio = client.text_to_speech.convert(
        text=text,
        voice_id=VOICE_ID,
        model_id="eleven_multilingual_v2",
        output_format="mp3_44100_128",
        voice_settings=VOICE_SETTINGS,
    )
    save(audio, str(out_path))
    print(f"  → 저장 완료: {out_path}")


if __name__ == "__main__":
    MUSIC_DIR.mkdir(parents=True, exist_ok=True)
    for filename, text in PROMPTS.items():
        generate(filename, text)
    print("\n모든 안내 음성 생성 완료!")
