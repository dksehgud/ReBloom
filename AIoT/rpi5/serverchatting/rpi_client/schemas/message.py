from typing import Optional

from pydantic import BaseModel


class ChatRequest(BaseModel):
    """Raspberry Pi가 LLM 서버로 보내는 사용자 발화 요청."""

    device_id: str
    session_id: str
    text: str


class ServerMessage(BaseModel):
    """LLM 서버가 Raspberry Pi로 보내는 스트리밍 응답."""

    type: str
    text: Optional[str] = None
    message: Optional[str] = None

