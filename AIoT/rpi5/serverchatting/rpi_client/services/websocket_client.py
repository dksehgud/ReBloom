import asyncio
import json
import logging
from typing import AsyncGenerator, Optional

import websockets
from pydantic import ValidationError
from websockets.exceptions import ConnectionClosed, WebSocketException
from websockets.protocol import State

from rpi_client.schemas.message import ChatRequest, ServerMessage

logger = logging.getLogger(__name__)


class LLMWebSocketError(RuntimeError):
    """LLM WebSocket 통신 오류."""


class LLMWebSocketClient:
    """LLM 서버와 WebSocket streaming 통신을 담당한다."""

    def __init__(
        self,
        url: str,
        reconnect_max_retries: int,
        reconnect_interval_seconds: float,
    ) -> None:
        self.url = url
        self.reconnect_max_retries = reconnect_max_retries
        self.reconnect_interval_seconds = reconnect_interval_seconds
        self.websocket = None

    async def connect(self) -> None:
        """WebSocket 연결을 생성한다. 실패 시 설정값에 따라 재시도한다."""

        last_error: Optional[BaseException] = None
        for attempt in range(1, self.reconnect_max_retries + 1):
            try:
                logger.info("WebSocket 연결 시도: %s (%d/%d)", self.url, attempt, self.reconnect_max_retries)
                self.websocket = await websockets.connect(self.url)
                logger.info("WebSocket 연결 성공")
                return
            except (OSError, WebSocketException) as exc:
                last_error = exc
                logger.warning("WebSocket 연결 실패: %s", exc)
                if attempt < self.reconnect_max_retries:
                    logger.info("재연결 시도 대기: %.1f초", self.reconnect_interval_seconds)
                    await asyncio.sleep(self.reconnect_interval_seconds)

        raise LLMWebSocketError(f"WebSocket 연결 실패: {last_error}") from last_error

    async def send_chat(self, request: ChatRequest) -> None:
        """사용자 발화 요청을 JSON으로 전송한다."""

        await self._ensure_connected()
        assert self.websocket is not None

        payload = request.model_dump_json()
        logger.info("서버 요청 전송: %s", payload)
        await self.websocket.send(payload)

    async def receive_stream(self) -> AsyncGenerator[str, None]:
        """서버 응답을 문장 단위 async generator로 반환한다."""

        await self._ensure_connected()
        assert self.websocket is not None

        try:
            async for raw_message in self.websocket:
                server_message = self._parse_server_message(raw_message)

                if server_message.type == "sentence":
                    if server_message.text:
                        logger.info("sentence chunk 수신: %s", server_message.text)
                        yield server_message.text
                    continue

                if server_message.type == "reply":
                    if server_message.text:
                        logger.info("reply 수신: %s", server_message.text)
                        yield server_message.text
                    return

                if server_message.type == "done":
                    logger.info("done 수신")
                    return

                if server_message.type == "error":
                    message = server_message.message or "알 수 없는 서버 오류"
                    logger.error("서버 오류 수신: %s", message)
                    raise LLMWebSocketError(message)

                logger.warning("알 수 없는 서버 메시지 타입: %s", server_message.type)

        except ConnectionClosed as exc:
            self.websocket = None
            logger.warning("WebSocket 연결이 끊어졌습니다: %s", exc)
            raise LLMWebSocketError("WebSocket 연결이 끊어졌습니다.") from exc

    async def stream_chat(self, request: ChatRequest) -> AsyncGenerator[str, None]:
        """요청 전송부터 streaming 수신까지 한 번의 대화 턴을 처리한다."""

        try:
            await self.send_chat(request)
            async for sentence in self.receive_stream():
                yield sentence
        except LLMWebSocketError:
            raise
        except (OSError, WebSocketException) as exc:
            self.websocket = None
            logger.exception("WebSocket 통신 중 오류 발생")
            raise LLMWebSocketError("WebSocket 통신 중 오류가 발생했습니다.") from exc

    async def close(self) -> None:
        """WebSocket 연결을 종료한다."""

        if self.websocket is not None:
            await self.websocket.close()
            self.websocket = None
            logger.info("WebSocket 연결 종료")

    async def _ensure_connected(self) -> None:
        if not self._is_connected():
            await self.connect()

    def _is_connected(self) -> bool:
        if self.websocket is None:
            return False

        # websockets 16.x는 closed 속성 대신 state를 제공한다.
        state = getattr(self.websocket, "state", None)
        if state is not None:
            return state == State.OPEN

        # 구버전 websockets 호환용 경로다.
        closed = getattr(self.websocket, "closed", None)
        if closed is not None:
            return not closed

        return True

    @staticmethod
    def _parse_server_message(raw_message: str | bytes) -> ServerMessage:
        try:
            if isinstance(raw_message, bytes):
                raw_message = raw_message.decode("utf-8")
            data = json.loads(raw_message)
            return ServerMessage.model_validate(data)
        except (json.JSONDecodeError, UnicodeDecodeError, ValidationError) as exc:
            logger.error("서버 메시지 파싱 실패: %s", raw_message)
            raise LLMWebSocketError("서버 메시지 형식이 올바르지 않습니다.") from exc
