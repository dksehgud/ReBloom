"""
ElevenLabs TTS 테스트 스크립트
실행 전: .env 파일에 ELEVENLABS_API_KEY 설정 필요
"""

import os
from dotenv import load_dotenv
from elevenlabs import ElevenLabs, VoiceSettings
from elevenlabs.play import play

load_dotenv()

API_KEY = os.getenv("ELEVENLABS_API_KEY")
if not API_KEY:
    raise ValueError(".env 파일에 ELEVENLABS_API_KEY를 설정해주세요.")

client = ElevenLabs(api_key=API_KEY)

# ============================================================
# 프리셋 목록 — 원하는 걸 골라서 speak()에 넘기면 됩니다
# ============================================================

# 중고등학생 상담 친구 느낌 (추천)
# Elli: 감정 표현이 풍부한 여성 목소리 → 공감형 상담에 잘 어울림
PRESET_TEEN_FRIEND = {
    "voice_id": "MF3mGyEYCl7XYWbV9V6O",  # Elli
    "model_id": "eleven_multilingual_v2",  # 한국어 자연스러움 최고 품질
    "settings": VoiceSettings(
        stability=0.28,         # 낮을수록 억양이 살아있어 사람다운 느낌
        similarity_boost=0.82,  # 높일수록 목소리 개성이 살아남
        style=0.50,             # 감정 표현 충분히 → AI 느낌 줄어듦
        use_speaker_boost=True,
        speed=1.0,
    ),
}

# 좀 더 차분하지만 따뜻한 느낌
# Bella: 부드럽고 온화한 여성 목소리
PRESET_WARM_CALM = {
    "voice_id": "EXAVITQu4vr4xnSDxMaL",  # Bella
    "model_id": "eleven_turbo_v2_5",
    "settings": VoiceSettings(
        stability=0.55,
        similarity_boost=0.80,
        style=0.25,
        use_speaker_boost=True,
        speed=0.98,
    ),
}

# 활기차고 에너지 넘치는 느낌
# Domi: 강하고 또렷한 여성 목소리
PRESET_ENERGETIC = {
    "voice_id": "AZnzlk1XvdvUeBnXmlld",  # Domi
    "model_id": "eleven_turbo_v2_5",
    "settings": VoiceSettings(
        stability=0.30,
        similarity_boost=0.85,
        style=0.55,
        use_speaker_boost=True,
        speed=1.12,
    ),
}


def speak(text: str, preset: dict) -> None:
    print(f"\n[재생] {text}")
    audio = client.text_to_speech.convert(
        text=text,
        voice_id=preset["voice_id"],
        model_id=preset["model_id"],
        output_format="mp3_44100_128",
        voice_settings=preset["settings"],
    )
    play(audio)


if __name__ == "__main__":
    sample = "야 그거 진짜 힘들었겠다. 그래서 어떻게 됐어? 나한테 다 얘기해봐, 같이 생각해보자!"

    print("=" * 50)
    print("1) TEEN_FRIEND (Elli) — 공감형 친구 느낌")
    print("=" * 50)
    speak(sample, PRESET_TEEN_FRIEND)

    input("\n엔터 누르면 다음 목소리로 넘어갑니다...")

    print("=" * 50)
    print("2) WARM_CALM (Bella) — 따뜻하고 차분한 느낌")
    print("=" * 50)
    speak(sample, PRESET_WARM_CALM)

    input("\n엔터 누르면 다음 목소리로 넘어갑니다...")

    print("=" * 50)
    print("3) ENERGETIC (Domi) — 활기차고 에너지 넘치는 느낌")
    print("=" * 50)
    speak(sample, PRESET_ENERGETIC)

    print("\n마음에 드는 프리셋 이름을 알려주시면 .env에 적용해드립니다!")
