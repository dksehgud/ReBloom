import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel, Field


SERVERCHATTING_DIR = Path(__file__).resolve().parents[2]
DEFAULT_OPENWAKEWORD_MODEL_PATHS = (
    str(SERVERCHATTING_DIR / "Wake_Model" / "hi_blooming.onnx"),
)


class Settings(BaseModel):
    """Raspberry Pi 클라이언트 실행 설정."""

    device_id: str
    llm_server_ws_url: str
    use_mock_stt: bool = True
    use_mock_tts: bool = True
    tts_sentence_delay: float = Field(default=0.8, ge=0)
    reconnect_max_retries: int = Field(default=3, ge=1)
    reconnect_interval_seconds: float = Field(default=2.0, ge=0)
    log_level: str = "WARNING"
    wait_tts_before_next_listen: bool = True
    filter_llm_reasoning_text: bool = True
    listen_mode: str = "vad"
    record_seconds: int = Field(default=5, ge=1)
    max_record_seconds: float = Field(default=20.0, ge=1)
    silence_seconds: float = Field(default=1.2, ge=0.1)
    start_timeout: float = Field(default=8.0, ge=0.1)
    wake_word_start_timeout: float = Field(default=2.0, ge=0.1)
    speech_threshold: float = Field(default=500.0, ge=0)
    audio_device: str = "auto"
    stt_retry_seconds: float = Field(default=5.0, ge=0.1)
    mic_busy_retry_seconds: float = Field(default=10.0, ge=0.1)
    start_sound: str = "on"
    start_sound_file: str = ""
    start_sound_player: str = "auto"
    start_sound_device: str = ""
    language: str = "ko"
    whisper_bin: str = "/home/ssafy/whisper.cpp/build/bin/whisper-cli"
    whisper_model: str = "/home/ssafy/whisper.cpp/models/ggml-base.bin"
    whisper_threads: int = Field(default=4, ge=1)
    whisper_fast: bool = False
    reprompt_on_empty: bool = True
    conversation_empty_turns_to_end: int = Field(default=1, ge=1)
    no_input_prompt: str = "잘 못 들었어요. 다시 한 번 말해 주세요."
    tts_engine: str = "auto"
    edge_voice: str = "ko-KR-SunHiNeural"
    edge_rate: str = "+0%"
    edge_volume: str = "+0%"
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = "JBFqnCBsd6RMkjVDRZzb"
    elevenlabs_model_id: str = "eleven_multilingual_v2"
    elevenlabs_output_format: str = "mp3_44100_128"
    elevenlabs_timeout_seconds: float = Field(default=30.0, ge=1.0)
    elevenlabs_stability: float = Field(default=0.45, ge=0.0, le=1.0)
    elevenlabs_similarity_boost: float = Field(default=0.8, ge=0.0, le=1.0)
    elevenlabs_style: float = Field(default=0.25, ge=0.0, le=1.0)
    elevenlabs_use_speaker_boost: bool = True
    elevenlabs_speed: float = Field(default=0.95, ge=0.7, le=1.2)
    mp3_player: str = "mpg123"
    mp3_player_args: str = ""
    tts_output_file: str = ""
    espeak_voice: str = "ko"
    piper_bin: str = "piper"
    piper_model: str = ""
    aplay_bin: str = "aplay"
    hf_tts_model: str = "myshell-ai/MeloTTS-Korean"
    hf_tts_device: str = "cpu"
    hf_tts_torch_dtype: str = "auto"
    melotts_language: str = "KR"
    melotts_speaker: str = "KR"
    melotts_speed: float = Field(default=1.0, ge=0.5, le=2.0)
    session_events_url: str = ""
    session_window_seconds: float = Field(default=300.0, ge=1)
    session_send_timeout: float = Field(default=5.0, ge=0.1)
    start_conversation_on_boot: bool = False
    wake_word_enabled: bool = True
    wake_word_engine: str = "openwakeword"
    wake_words: tuple[str, ...] = ("hi blooming", "하이 블루밍")
    openwakeword_model_paths: tuple[str, ...] = DEFAULT_OPENWAKEWORD_MODEL_PATHS
    openwakeword_threshold: float = Field(default=0.5, ge=0.0, le=1.0)
    openwakeword_debug: bool = False
    openwakeword_rearm_seconds: float = Field(default=2.0, ge=0.0)
    openwakeword_flush_seconds: float = Field(default=0.5, ge=0.0)
    trigger_api_host: str = "0.0.0.0"
    trigger_api_port: int = Field(default=8085, ge=1, le=65535)
    trigger_api_path: str = "/api/v1/analyses/conversations"
    trigger_greeting: str = "안녕! 무슨 일이 있니?"
    mqtt_enabled: bool = False
    mqtt_host: str = ""
    mqtt_port: int = Field(default=1883, ge=1, le=65535)
    mqtt_username: str = ""
    mqtt_password: str = ""
    mqtt_client_id: str = ""
    mqtt_conversation_start_topic: str = ""
    mqtt_keepalive_seconds: int = Field(default=60, ge=5)


@lru_cache
def get_settings() -> Settings:
    """환경변수를 로드하고 설정 객체를 반환한다."""

    load_dotenv()
    return Settings(
        device_id=_required_env("DEVICE_ID"),
        llm_server_ws_url=_required_env("LLM_SERVER_WS_URL"),
        use_mock_stt=_get_bool_env("USE_MOCK_STT", True),
        use_mock_tts=_get_bool_env("USE_MOCK_TTS", True),
        tts_sentence_delay=_get_float_env("TTS_SENTENCE_DELAY", 0.8),
        reconnect_max_retries=_get_int_env("RECONNECT_MAX_RETRIES", 3),
        reconnect_interval_seconds=_get_float_env("RECONNECT_INTERVAL_SECONDS", 2.0),
        log_level=os.getenv("LOG_LEVEL", "WARNING").strip().upper(),
        wait_tts_before_next_listen=_get_bool_env("WAIT_TTS_BEFORE_NEXT_LISTEN", True),
        filter_llm_reasoning_text=_get_bool_env("FILTER_LLM_REASONING_TEXT", True),
        listen_mode=os.getenv("LISTEN_MODE", "vad").strip(),
        record_seconds=_get_int_env("RECORD_SECONDS", 5),
        max_record_seconds=_get_float_env("MAX_RECORD_SECONDS", 20.0),
        silence_seconds=_get_float_env("SILENCE_SECONDS", 1.2),
        start_timeout=_get_float_env("START_TIMEOUT", 8.0),
        wake_word_start_timeout=_get_float_env("WAKE_WORD_START_TIMEOUT", 2.0),
        speech_threshold=_get_float_env("SPEECH_THRESHOLD", 500.0),
        audio_device=os.getenv("AUDIO_DEVICE", "auto").strip(),
        stt_retry_seconds=_get_float_env("STT_RETRY_SECONDS", 5.0),
        mic_busy_retry_seconds=_get_float_env("MIC_BUSY_RETRY_SECONDS", 10.0),
        start_sound=os.getenv("START_SOUND", "on").strip(),
        start_sound_file=os.getenv("START_SOUND_FILE", "").strip(),
        start_sound_player=os.getenv("START_SOUND_PLAYER", "auto").strip(),
        start_sound_device=os.getenv("START_SOUND_DEVICE", "").strip(),
        language=os.getenv("LANGUAGE", "ko").strip(),
        whisper_bin=os.getenv("WHISPER_BIN", "/home/ssafy/whisper.cpp/build/bin/whisper-cli").strip(),
        whisper_model=os.getenv("WHISPER_MODEL", "/home/ssafy/whisper.cpp/models/ggml-base.bin").strip(),
        whisper_threads=_get_int_env("WHISPER_THREADS", 4),
        whisper_fast=_get_bool_env("WHISPER_FAST", False),
        reprompt_on_empty=_get_bool_env("REPROMPT_ON_EMPTY", True),
        conversation_empty_turns_to_end=_get_int_env("CONVERSATION_EMPTY_TURNS_TO_END", 1),
        no_input_prompt=os.getenv("NO_INPUT_PROMPT", "잘 못 들었어요. 다시 한 번 말해 주세요.").strip(),
        tts_engine=os.getenv("TTS_ENGINE", "auto").strip(),
        edge_voice=os.getenv("EDGE_VOICE", "ko-KR-SunHiNeural").strip(),
        edge_rate=os.getenv("EDGE_RATE", "+0%").strip(),
        edge_volume=os.getenv("EDGE_VOLUME", "+0%").strip(),
        elevenlabs_api_key=os.getenv("ELEVENLABS_API_KEY", "").strip(),
        elevenlabs_voice_id=os.getenv("ELEVENLABS_VOICE_ID", "JBFqnCBsd6RMkjVDRZzb").strip(),
        elevenlabs_model_id=os.getenv("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2").strip(),
        elevenlabs_output_format=os.getenv("ELEVENLABS_OUTPUT_FORMAT", "mp3_44100_128").strip(),
        elevenlabs_timeout_seconds=_get_float_env("ELEVENLABS_TIMEOUT_SECONDS", 30.0),
        elevenlabs_stability=_get_float_env("ELEVENLABS_STABILITY", 0.45),
        elevenlabs_similarity_boost=_get_float_env("ELEVENLABS_SIMILARITY_BOOST", 0.8),
        elevenlabs_style=_get_float_env("ELEVENLABS_STYLE", 0.25),
        elevenlabs_use_speaker_boost=_get_bool_env("ELEVENLABS_USE_SPEAKER_BOOST", True),
        elevenlabs_speed=_get_float_env("ELEVENLABS_SPEED", 0.95),
        mp3_player=os.getenv("MP3_PLAYER", "mpg123").strip(),
        mp3_player_args=os.getenv("MP3_PLAYER_ARGS", "").strip(),
        tts_output_file=os.getenv("TTS_OUTPUT_FILE", "").strip(),
        espeak_voice=os.getenv("ESPEAK_VOICE", "ko").strip(),
        piper_bin=os.getenv("PIPER_BIN", "piper").strip(),
        piper_model=os.getenv("PIPER_MODEL", "").strip(),
        aplay_bin=os.getenv("APLAY_BIN", "aplay").strip(),
        hf_tts_model=os.getenv("HF_TTS_MODEL", "myshell-ai/MeloTTS-Korean").strip(),
        hf_tts_device=os.getenv("HF_TTS_DEVICE", "cpu").strip(),
        hf_tts_torch_dtype=os.getenv("HF_TTS_TORCH_DTYPE", "auto").strip(),
        melotts_language=os.getenv("MELOTTS_LANGUAGE", "KR").strip(),
        melotts_speaker=os.getenv("MELOTTS_SPEAKER", "KR").strip(),
        melotts_speed=_get_float_env("MELOTTS_SPEED", 1.0),
        session_events_url=os.getenv("SESSION_EVENTS_URL", "").strip(),
        session_window_seconds=_get_float_env("SESSION_WINDOW_SECONDS", 300.0),
        session_send_timeout=_get_float_env("SESSION_SEND_TIMEOUT", 5.0),
        start_conversation_on_boot=_get_bool_env("START_CONVERSATION_ON_BOOT", False),
        wake_word_enabled=_get_bool_env("WAKE_WORD_ENABLED", True),
        wake_word_engine=os.getenv("WAKE_WORD_ENGINE", "openwakeword").strip().lower(),
        wake_words=_get_csv_env("WAKE_WORDS", ("hi blooming", "하이 블루밍")),
        openwakeword_model_paths=_get_csv_env("OPENWAKEWORD_MODEL_PATHS", DEFAULT_OPENWAKEWORD_MODEL_PATHS),
        openwakeword_threshold=_get_float_env("OPENWAKEWORD_THRESHOLD", 0.5),
        openwakeword_debug=_get_bool_env("OPENWAKEWORD_DEBUG", False),
        openwakeword_rearm_seconds=_get_float_env("OPENWAKEWORD_REARM_SECONDS", 2.0),
        openwakeword_flush_seconds=_get_float_env("OPENWAKEWORD_FLUSH_SECONDS", 0.5),
        trigger_api_host=os.getenv("TRIGGER_API_HOST", "0.0.0.0").strip(),
        trigger_api_port=_get_int_env("TRIGGER_API_PORT", 8085),
        trigger_api_path=os.getenv("TRIGGER_API_PATH", "/api/v1/analyses/conversations").strip(),
        trigger_greeting=os.getenv("TRIGGER_GREETING", "안녕! 무슨 일이 있니?").strip(),
        mqtt_enabled=_get_bool_env("MQTT_ENABLED", False),
        mqtt_host=os.getenv("MQTT_HOST", "").strip(),
        mqtt_port=_get_int_env("MQTT_PORT", 1883),
        mqtt_username=os.getenv("MQTT_USERNAME", "").strip(),
        mqtt_password=os.getenv("MQTT_PASSWORD", "").strip(),
        mqtt_client_id=os.getenv("MQTT_CLIENT_ID", "").strip(),
        mqtt_conversation_start_topic=os.getenv("MQTT_CONVERSATION_START_TOPIC", "").strip(),
        mqtt_keepalive_seconds=_get_int_env("MQTT_KEEPALIVE_SECONDS", 60),
    )


def _required_env(name: str) -> str:
    value = os.getenv(name)
    if value is None or not value.strip():
        raise ValueError(f"필수 환경변수가 없습니다: {name}")
    return value.strip()


def _get_bool_env(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


def _get_int_env(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None or not value.strip():
        return default
    return int(value)


def _get_float_env(name: str, default: float) -> float:
    value = os.getenv(name)
    if value is None or not value.strip():
        return default
    return float(value)


def _get_csv_env(name: str, default: tuple[str, ...]) -> tuple[str, ...]:
    value = os.getenv(name)
    if value is None or not value.strip():
        return default
    values = tuple(item.strip() for item in value.split(",") if item.strip())
    return values or default
