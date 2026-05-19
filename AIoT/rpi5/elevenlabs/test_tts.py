"""
ElevenLabs TTS 자연스러운 발화 커스터마이징 테스트 스크립트

자연스러움을 결정하는 핵심 파라미터:
  stability      : 낮을수록 억양 변화가 크고 사람다운 느낌. 너무 낮으면 불안정해짐. (권장: 0.15 ~ 0.35)
  similarity_boost: 높을수록 원본 목소리 개성 유지. (권장: 0.75 ~ 0.90)
  style          : 높을수록 감정 표현이 강해짐. (권장: 0.45 ~ 0.80)
  speed          : 살짝 느리게(0.93 ~ 0.98) 하면 발음이 뭉개지지 않고 자연스러움

실행: python test_tts.py
"""

import os
from dotenv import load_dotenv
from elevenlabs import ElevenLabs, VoiceSettings
from elevenlabs.play import play

load_dotenv()

API_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID")

if not API_KEY:
    raise ValueError(".env 파일에 ELEVENLABS_API_KEY를 설정해주세요.")
if not VOICE_ID:
    raise ValueError(".env 파일에 ELEVENLABS_VOICE_ID를 설정해주세요.")

client = ElevenLabs(api_key=API_KEY)

# ============================================================
# 현재 적용 중인 설정 (serverchatting/.env 기준)
# ============================================================

PRESET_CURRENT = {
    "voice_id": VOICE_ID,
    "model_id": "eleven_multilingual_v2",
    "settings": VoiceSettings(
        stability=0.28,
        similarity_boost=0.82,
        style=0.50,
        use_speaker_boost=True,
        speed=1.0,
    ),
}

# ============================================================
# 자연스러움 강화 프리셋 — stability ↓, style ↑ 로 AI 느낌 줄임
# ============================================================

# [A] 자연스러운 친구 톤 — stability 더 낮추고 style 올려서 억양 살림
PRESET_NATURAL_A = {
    "voice_id": VOICE_ID,
    "model_id": "eleven_multilingual_v2",
    "settings": VoiceSettings(
        stability=0.20,        # 억양 변화 ↑ → 사람다운 리듬감
        similarity_boost=0.82,
        style=0.65,            # 감정 표현 ↑ → AI 단조로움 제거
        use_speaker_boost=True,
        speed=0.97,            # 살짝 느리게 → 발음 선명 + 여유로운 느낌
    ),
}

# [B] 에너지 있고 자연스러운 톤 — stability 최소, style 높음
PRESET_NATURAL_B = {
    "voice_id": VOICE_ID,
    "model_id": "eleven_multilingual_v2",
    "settings": VoiceSettings(
        stability=0.15,        # 억양 변화 최대
        similarity_boost=0.78,
        style=0.72,
        use_speaker_boost=True,
        speed=1.0,
    ),
}

# [C] 차분하지만 자연스러운 톤 — stability 조금 올리고 style 중간
PRESET_NATURAL_C = {
    "voice_id": VOICE_ID,
    "model_id": "eleven_multilingual_v2",
    "settings": VoiceSettings(
        stability=0.30,
        similarity_boost=0.85,
        style=0.58,
        use_speaker_boost=True,
        speed=0.95,            # 더 느리게 → 신중하고 따뜻한 느낌
    ),
}

# [D] B + C 혼합 — B의 활발한 억양 + C의 안정감 있는 속도
PRESET_NATURAL_D = {
    "voice_id": VOICE_ID,
    "model_id": "eleven_multilingual_v2",
    "settings": VoiceSettings(
        stability=0.22,        # B(0.15)와 C(0.30) 중간
        similarity_boost=0.82, # B(0.78)와 C(0.85) 중간
        style=0.65,            # B(0.72)와 C(0.58) 중간
        use_speaker_boost=True,
        speed=0.97,            # B(1.0)와 C(0.95) 중간
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

    print("=" * 55)
    print("0) CURRENT — 현재 serverchatting 적용 중인 설정")
    print("   stability=0.28 / style=0.50 / speed=1.0")
    print("=" * 55)
    speak(sample, PRESET_CURRENT)

    input("\n엔터 → 다음 프리셋")

    print("=" * 55)
    print("A) NATURAL_A — stability↓ style↑  (가장 자연스러운 억양)")
    print("   stability=0.20 / style=0.65 / speed=0.97")
    print("=" * 55)
    speak(sample, PRESET_NATURAL_A)

    input("\n엔터 → 다음 프리셋")

    print("=" * 55)
    print("B) NATURAL_B — stability 최소, style 높음 (에너지 있는 자연스러움)")
    print("   stability=0.15 / style=0.72 / speed=1.0")
    print("=" * 55)
    speak(sample, PRESET_NATURAL_B)

    input("\n엔터 → 다음 프리셋")

    print("=" * 55)
    print("C) NATURAL_C — 차분하고 느린 자연스러움")
    print("   stability=0.30 / style=0.58 / speed=0.95")
    print("=" * 55)
    speak(sample, PRESET_NATURAL_C)

    input("\n엔터 → 다음 프리셋")

    print("=" * 55)
    print("D) NATURAL_D — B(활발한 억양) + C(안정감 있는 속도) 혼합")
    print("   stability=0.22 / style=0.65 / speed=0.97")
    print("=" * 55)
    speak(sample, PRESET_NATURAL_D)

    print("\n마음에 드는 프리셋(A/B/C/D)을 알려주시면 serverchatting/.env에 바로 적용해드립니다!")
