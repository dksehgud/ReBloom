"""
채팅 라우터.

다음 세 가지 API를 제공한다.
1. POST /api/v1/chat         - 일반 non-streaming 응답
2. WS   /api/v1/chat/ws     - WebSocket streaming (문장 단위)
3. POST /api/v1/chat/sse    - SSE streaming (문장 단위)

공통 처리:
- 입력 텍스트 검증
- 위기 키워드 감지 (안전 응답 전환)
- session_id, device_id 로깅
"""

import json
import logging
from typing import AsyncGenerator

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import StreamingResponse

from app.schemas.chat import ChatRequest, ChatResponse
from app.core.prompts import is_crisis_text
from app.services.llm_client import complete_chat, stream_chat, LLMClientError
from app.services.sentence_streamer import sentence_stream

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])


# ─────────────────────────────────────────────
# 1. POST /api/v1/chat  (non-streaming)
# ─────────────────────────────────────────────


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """
    일반 채팅 API. 응답을 한 번에 반환한다.

    라즈베리파이의 간단한 HTTP 요청 테스트에 사용하거나,
    스트리밍이 필요 없는 클라이언트에서 사용한다.
    """
    logger.info(
        f"[chat] device_id={request.device_id} session_id={request.session_id} "
        f"text={request.text!r}"
    )

    # 위기 키워드 감지
    crisis = is_crisis_text(request.text)
    if crisis:
        logger.warning(
            f"[chat] 위기 키워드 감지: device={request.device_id}, session={request.session_id}"
        )

    try:
        reply = await complete_chat(request.text, is_crisis=crisis)
    except LLMClientError as e:
        logger.error(f"[chat] LLM 오류: {e}")
        reply = "잠시 연결이 어렵네. 조금 후에 다시 이야기해 줄게."

    return ChatResponse(reply=reply)


# ─────────────────────────────────────────────
# 2. WS /api/v1/chat/ws  (WebSocket streaming)
# ─────────────────────────────────────────────


@router.websocket("/ws")
async def chat_ws(websocket: WebSocket) -> None:
    """
    WebSocket 기반 채팅 API. 단일 연결에서 다중 턴 대화를 지원한다.

    클라이언트 → 서버 (매 턴마다 전송):
        {"device_id": "...", "session_id": "...", "text": "...", "stream": false}
        - device_id / session_id: 첫 메시지에서 설정, 이후 생략 가능
        - stream: false (기본) → {"type": "reply", "text": "..."}  한 번에 전송
        - stream: true        → {"type": "sentence"} 여러 번 + {"type": "done"}

    연결이 끊겨도 서버가 죽지 않도록 WebSocketDisconnect를 포착한다.
    """
    await websocket.accept()
    logger.info("[ws] WebSocket 연결 수립")

    device_id: str = ""
    session_id: str = ""
    # 연결 단위로 대화 히스토리 유지 (최대 10턴 = 20개 메시지)
    conversation_history: list[dict] = []
    MAX_HISTORY_TURNS = 10

    try:
        # 연결이 살아 있는 동안 계속 메시지를 받아 처리
        while True:
            raw = await websocket.receive_text()

            # JSON 파싱
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_text(
                    json.dumps({"type": "error", "message": "JSON 파싱 오류"})
                )
                continue  # 연결 유지, 다음 메시지 대기

            # device_id / session_id 는 처음 한 번 설정 후 이후 생략 가능
            device_id = data.get("device_id", device_id).strip()
            session_id = data.get("session_id", session_id).strip()
            text = data.get("text", "").strip()
            use_stream = data.get("stream", False)

            if not device_id or not session_id:
                await websocket.send_text(
                    json.dumps({"type": "error", "message": "device_id와 session_id는 필수입니다."})
                )
                continue

            if not text:
                await websocket.send_text(
                    json.dumps({"type": "error", "message": "text가 비어 있습니다."})
                )
                continue

            logger.info(
                f"[ws] device_id={device_id} session_id={session_id} text={text!r}"
            )

            # 위기 키워드 감지
            crisis = is_crisis_text(text)
            if crisis:
                logger.warning(
                    f"[ws] 위기 키워드 감지: device={device_id}, session={session_id}"
                )

            # LLM 호출 및 응답 전송
            try:
                if use_stream:
                    # 문장 단위 스트리밍 모드 (라즈베리파이 TTS 용도)
                    token_gen = stream_chat(text, is_crisis=crisis, history=conversation_history)
                    parts: list[str] = []
                    async for sentence in sentence_stream(token_gen):
                        await websocket.send_text(
                            json.dumps({"type": "sentence", "text": sentence}, ensure_ascii=False)
                        )
                        parts.append(sentence)
                    await websocket.send_text(json.dumps({"type": "done"}))
                    full_reply = " ".join(parts).strip()

                else:
                    # 전체 답변 한 번에 전송 모드 (채팅 UI 기본)
                    token_gen = stream_chat(text, is_crisis=crisis, history=conversation_history)
                    parts = []
                    async for sentence in sentence_stream(token_gen):
                        parts.append(sentence)

                    full_reply = " ".join(parts).strip()
                    await websocket.send_text(
                        json.dumps({"type": "reply", "text": full_reply}, ensure_ascii=False)
                    )

                # 히스토리에 이번 턴 추가
                if full_reply:
                    conversation_history.append({"role": "user", "content": text})
                    conversation_history.append({"role": "assistant", "content": full_reply})
                    # 최대 턴 수 초과 시 오래된 것부터 제거 (2개씩 = 1턴)
                    if len(conversation_history) > MAX_HISTORY_TURNS * 2:
                        conversation_history = conversation_history[-(MAX_HISTORY_TURNS * 2):]

            except LLMClientError as e:
                logger.error(f"[ws] LLM 오류: {e}")
                await websocket.send_text(
                    json.dumps({"type": "error", "message": "LLM 서버에 연결하지 못했습니다."})
                )
                # LLM 오류가 발생해도 연결은 유지

    except WebSocketDisconnect:
        logger.info(f"[ws] 클라이언트 연결 종료 | device={device_id} session={session_id}")
    except Exception as e:
        logger.exception(f"[ws] 예상치 못한 오류: {e}")
        try:
            await websocket.send_text(
                json.dumps({"type": "error", "message": "서버 내부 오류가 발생했습니다."})
            )
        except Exception:
            pass


# ─────────────────────────────────────────────
# 3. POST /api/v1/chat/sse  (SSE streaming)
# ─────────────────────────────────────────────



async def _sse_event(event: str, data: dict) -> str:
    """SSE 이벤트 문자열을 포맷한다."""
    data_str = json.dumps(data, ensure_ascii=False)
    return f"event: {event}\ndata: {data_str}\n\n"


async def _sse_generator(
    text: str, is_crisis: bool
) -> AsyncGenerator[str, None]:
    """
    문장 단위 SSE 이벤트 스트림을 생성하는 async generator.

    SSE 형식:
        event: sentence
        data: {"text": "..."}

        event: done
        data: {}
    """
    try:
        token_gen = stream_chat(text, is_crisis=is_crisis)
        async for sentence in sentence_stream(token_gen):
            yield await _sse_event("sentence", {"text": sentence})

        yield await _sse_event("done", {})

    except LLMClientError as e:
        logger.error(f"[sse] LLM 오류: {e}")
        yield await _sse_event("error", {"message": "LLM 서버에 연결하지 못했습니다."})
    except Exception as e:
        logger.exception(f"[sse] 예상치 못한 오류: {e}")
        yield await _sse_event("error", {"message": "서버 내부 오류가 발생했습니다."})


@router.post("/sse")
async def chat_sse(request: ChatRequest, req: Request) -> StreamingResponse:
    """
    SSE 기반 스트리밍 채팅 API.

    POST 방식으로 요청을 받아 SSE 형식으로 문장 단위 응답을 스트리밍한다.
    라즈베리파이에서 EventSource 대신 HTTP POST + SSE를 사용할 때 적합하다.

    응답 헤더:
        Content-Type: text/event-stream
        Cache-Control: no-cache
        X-Accel-Buffering: no  (nginx 프록시 buffering 비활성화)
    """
    logger.info(
        f"[sse] device_id={request.device_id} session_id={request.session_id} "
        f"text={request.text!r}"
    )

    # 위기 키워드 감지
    crisis = is_crisis_text(request.text)
    if crisis:
        logger.warning(
            f"[sse] 위기 키워드 감지: device={request.device_id}, session={request.session_id}"
        )

    return StreamingResponse(
        _sse_generator(request.text, is_crisis=crisis),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
