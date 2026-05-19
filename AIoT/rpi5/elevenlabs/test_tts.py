"""
ElevenLabs TTS 자연스러움 후보군 비교 테스트

파라미터 가이드:
  stability      : 낮을수록 억양 변화↑ 사람다운 느낌. 너무 낮으면 발음 불안정.
  similarity_boost: 높을수록 원본 목소리 개성 유지.
  style          : 높을수록 감정 표현↑. 너무 높으면 과장된 느낌.
  speed          : 낮을수록 느리고 여유있는 발화. (min ~0.7)

실행: python test_tts.py
     (serverchatting/.env에서 API_KEY/VOICE_ID 자동 로드)
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from elevenlabs import ElevenLabs, VoiceSettings
from elevenlabs.play import play

# serverchatting/.env 로드
_env_path = Path(__file__).resolve().parents[1] / "serverchatting" / ".env"
load_dotenv(dotenv_path=_env_path)

API_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "aiUUgjHa4mpHf6UenZuf")
MODEL_ID = "eleven_multilingual_v2"

if not API_KEY:
    raise ValueError(f".env 파일에 ELEVENLABS_API_KEY가 없습니다: {_env_path}")

client = ElevenLabs(api_key=API_KEY)

# ============================================================
# 현재 serverchatting/.env 적용 중인 설정
# ============================================================
PRESET_CURRENT = {
    "label": "CURRENT  — 현재 적용 중 (stability=0.15 / style=0.72 / speed=0.90)",
    "settings": VoiceSettings(
        stability=0.15,
        similarity_boost=0.78,
        style=0.72,
        use_speaker_boost=True,
        speed=0.90,
    ),
}

# ============================================================
# 후보군 A ~ E
# ============================================================

# [A] 안정감 올리고 style 약간 낮춤 — 덜 과장되고 자연스러운 친구 톤
PRESET_A = {
    "label": "A  — 안정된 자연스러움  (stability=0.25 / style=0.60 / speed=0.90)",
    "settings": VoiceSettings(
        stability=0.25,
        similarity_boost=0.80,
        style=0.60,
        use_speaker_boost=True,
        speed=0.90,
    ),
}

# [B] 감정 표현 최대화 — 억양 변화가 크고 활기찬 톤
PRESET_B = {
    "label": "B  — 활발한 감정 표현   (stability=0.10 / style=0.80 / speed=0.93)",
    "settings": VoiceSettings(
        stability=0.10,
        similarity_boost=0.78,
        style=0.80,
        use_speaker_boost=True,
        speed=0.93,
    ),
}

# [C] 차분하고 따뜻한 톤 — 상담자 느낌, 느리고 안정적
PRESET_C = {
    "label": "C  — 따뜻하고 차분      (stability=0.30 / style=0.55 / speed=0.85)",
    "settings": VoiceSettings(
        stability=0.30,
        similarity_boost=0.85,
        style=0.55,
        use_speaker_boost=True,
        speed=0.85,
    ),
}

# [D] 현재(B)에서 stability만 조금 올린 균형점
PRESET_D = {
    "label": "D  — 현재 기준 균형점   (stability=0.20 / style=0.70 / speed=0.90)",
    "settings": VoiceSettings(
        stability=0.20,
        similarity_boost=0.80,
        style=0.70,
        use_speaker_boost=True,
        speed=0.90,
    ),
}

# [E] style 낮추고 speed 살짝 올림 — 덜 감정적이지만 발음 선명
PRESET_E = {
    "label": "E  — 선명한 발음 중심   (stability=0.22 / style=0.50 / speed=0.95)",
    "settings": VoiceSettings(
        stability=0.22,
        similarity_boost=0.82,
        style=0.50,
        use_speaker_boost=True,
        speed=0.95,
    ),
}

PRESETS = [
    ("0 (현재)", PRESET_CURRENT),
    ("A", PRESET_A),
    ("B", PRESET_B),
    ("C", PRESET_C),
    ("D", PRESET_D),
    ("E", PRESET_E),
]

# ============================================================
# 샘플 텍스트 — 감정 표현과 자연스러움을 잘 드러내는 문장
# ============================================================
SAMPLE = "야, 그거 진짜 많이 힘들었겠다. 그래서 지금 어떤 기분이야? 나한테 다 얘기해봐, 같이 생각해보자!"


def speak(preset: dict) -> None:
    audio = client.text_to_speech.convert(
        text=SAMPLE,
        voice_id=VOICE_ID,
        model_id=MODEL_ID,
        output_format="mp3_44100_128",
        voice_settings=preset["settings"],
    )
    play(audio)


if __name__ == "__main__":
    print(f"\n샘플 텍스트: {SAMPLE}\n")

    for key, preset in PRESETS:
        print("=" * 60)
        print(f"[{key}] {preset['label']}")
        print("=" * 60)
        speak(preset)
        if key != PRESETS[-1][0]:
            input("\n엔터 → 다음 프리셋\n")

    print("\n마음에 드는 프리셋(A/B/C/D/E)을 알려주시면 serverchatting/.env에 바로 적용해드립니다!")
