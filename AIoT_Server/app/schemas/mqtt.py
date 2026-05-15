"""
MQTT publish 요청/응답 스키마.
"""

from typing import Optional

from pydantic import BaseModel, Field


class ConversationStartPublishRequest(BaseModel):
    """대화 시작 MQTT publish 요청."""

    device_id: str = Field(..., min_length=1, description="대상 Raspberry Pi 디바이스 ID")
    greeting: str = Field(
        ...,
        min_length=1,
        description="기기에서 첫 번째로 재생할 인사말",
    )
    request_id: Optional[str] = Field(
        default=None,
        description="추적용 요청 ID. 비우면 서버에서 UUID를 생성한다.",
    )


class ConversationStartPublishResponse(BaseModel):
    """대화 시작 MQTT publish 응답."""

    status: str = Field(..., description="publish 결과 상태")
    topic: str = Field(..., description="publish 된 MQTT topic")
    request_id: str = Field(..., description="실제 사용된 요청 ID")
    payload: dict = Field(..., description="publish 된 payload")
