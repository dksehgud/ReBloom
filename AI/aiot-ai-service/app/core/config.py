"""
환경변수 기반 설정 모듈.
pydantic-settings를 사용해 .env 파일 및 환경변수를 자동으로 읽는다.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """애플리케이션 설정 클래스."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ---------- 앱 기본 설정 ----------
    APP_ENV: str = Field(default="development", description="실행 환경 (development / production)")
    SERVER_PORT: int = Field(default=8001, description="서버 포트")

    # ---------- LLM 공급자 설정 ----------
    LLM_PROVIDER: str = Field(
        default="vllm",
        description="LLM 공급자 (vllm / openai). 현재는 vllm OpenAI-compatible endpoint 사용",
    )
    OPENAI_BASE_URL: str = Field(
        default="http://localhost:8000/v1",
        description="vLLM 또는 OpenAI-compatible endpoint의 base URL",
    )
    OPENAI_API_KEY: str = Field(
        default="EMPTY",
        description="API 키. vLLM 로컬 서버는 임의 문자열로도 통과됨",
    )
    LLM_MODEL: str = Field(
        default="qwen3-8b-instruct",
        description="사용할 모델 이름 (vLLM에 올려진 모델 이름과 동일해야 함)",
    )

    # ---------- Mock 모드 ----------
    USE_MOCK_LLM: bool = Field(
        default=False,
        description="True이면 vLLM을 호출하지 않고 미리 정의된 응답을 반환 (로컬 테스트용)",
    )

    # ---------- 생성 파라미터 ----------
    MAX_NEW_TOKENS: int = Field(default=150, description="최대 생성 토큰 수")
    TEMPERATURE: float = Field(default=0.7, description="샘플링 온도")
    TOP_P: float = Field(default=0.9, description="Top-p 샘플링")

    # ---------- 연결/타임아웃 ----------
    LLM_TIMEOUT: float = Field(default=30.0, description="LLM API 호출 타임아웃 (초)")

    # ---------- GPS 위치 판단 ----------
    AUTH_SERVICE_BASE_URL: str = Field(
        default="http://localhost:8081",
        description="auth-service base URL",
    )
    AUTH_SERVICE_LOCATION_PATH: str = Field(
        default="/api/v1/internal/children/{user_id}/target-location",
        description="auth-service internal child GPS path template",
    )
    AUTH_SERVICE_TIMEOUT: float = Field(
        default=3.0,
        description="auth-service HTTP timeout seconds",
    )
    LOCATION_RADIUS_METERS: float = Field(
        default=100.0,
        description="location trigger radius in meters",
    )
    LOCATION_TARGET_NAME: str = Field(
        default="registered_location",
        description="target name included in location responses and MQTT payloads",
    )

    # ---------- MQTT 브로커 설정 ----------
    MQTT_HOST: str = Field(default="localhost", description="MQTT broker host")
    MQTT_PORT: int = Field(default=7000, description="MQTT broker external port")
    MQTT_USERNAME: str = Field(default="backend-api", description="MQTT username")
    MQTT_PASSWORD: str = Field(default="", description="MQTT password")
    MQTT_CLIENT_ID: str = Field(default="rebloom-llm-server", description="MQTT client id")
    MQTT_KEEPALIVE: int = Field(default=60, description="MQTT keepalive seconds")
    MQTT_QOS: int = Field(default=1, description="MQTT publish QoS")
    MQTT_RETAIN: bool = Field(default=False, description="MQTT retain flag")
    MQTT_TOPIC_CONVERSATION_START: str = Field(
        default="devices/{device_id}/conversation/start",
        description="대화 시작 명령용 topic template",
    )
    MQTT_LOCATION_TOPIC_SIGNAL: str = Field(
        default="devices/{device_id}/location/trigger",
        description="location trigger topic template",
    )


# 싱글턴처럼 사용
settings = Settings()
