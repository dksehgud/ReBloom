"""
채팅 관련 Pydantic 스키마 정의.

요청/응답 모델을 명확하게 분리해 관리한다.
"""

from pydantic import BaseModel, Field
from typing import Optional


# ─────────────────────────────────────────────
# 공통 사용자 프로필
# ─────────────────────────────────────────────
class UserProfile(BaseModel):
    """사용자 프로필 정보. 현재는 age_group만 사용."""

    age_group: Optional[str] = Field(
        default="teenager",
        description="사용자 연령대 (teenager / adult 등)",
    )


# ─────────────────────────────────────────────
# POST /api/v1/chat 요청 스키마
# ─────────────────────────────────────────────
class ChatRequest(BaseModel):
    """일반 채팅 API 요청 본문."""

    device_id: str = Field(..., min_length=1, description="라즈베리파이 디바이스 ID")
    session_id: str = Field(..., min_length=1, description="대화 세션 ID")
    text: str = Field(..., min_length=1, description="사용자 발화 텍스트 (STT 결과)")
    user_profile: Optional[UserProfile] = Field(
        default_factory=UserProfile,
        description="사용자 프로필 (선택)",
    )


# ─────────────────────────────────────────────
# POST /api/v1/chat 응답 스키마
# ─────────────────────────────────────────────
class ChatResponse(BaseModel):
    """일반 채팅 API 응답 본문."""

    reply: str = Field(..., description="LLM이 생성한 응답 텍스트")


# ─────────────────────────────────────────────
# WebSocket / SSE 공통 메시지 타입 (참고용 문서)
# ─────────────────────────────────────────────
# WebSocket streaming 메시지 형식 (JSON):
#   sentence : {"type": "sentence", "text": "..."}
#   done     : {"type": "done"}
#   error    : {"type": "error", "message": "..."}
#
# SSE streaming 메시지 형식:
#   event: sentence\ndata: {"text": "..."}\n\n
#   event: done\ndata: {}\n\n
