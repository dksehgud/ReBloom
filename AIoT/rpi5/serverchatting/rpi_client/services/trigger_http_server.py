import asyncio
import json
import logging
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from urllib.parse import urlparse

from rpi_client.core.config import Settings
from rpi_client.services.conversation_manager import ConversationManager

logger = logging.getLogger(__name__)


class ConversationTriggerHTTPServer:
    """외부 GET 요청으로 라즈베리파이 대화를 시작하는 작은 HTTP 서버."""

    def __init__(self, config: Settings, conversation_manager: ConversationManager) -> None:
        self.config = config
        self.conversation_manager = conversation_manager
        self._loop: asyncio.AbstractEventLoop | None = None
        self._server: ThreadingHTTPServer | None = None
        self._thread: Thread | None = None

    async def start(self) -> None:
        self._loop = asyncio.get_running_loop()
        handler_class = self._create_handler()
        self._server = ThreadingHTTPServer((self.config.trigger_api_host, self.config.trigger_api_port), handler_class)
        self._thread = Thread(target=self._server.serve_forever, name="conversation-trigger-http", daemon=True)
        self._thread.start()
        logger.info(
            "대화 트리거 HTTP 서버 시작: http://%s:%d%s",
            self.config.trigger_api_host,
            self.config.trigger_api_port,
            self.config.trigger_api_path,
        )

    async def stop(self) -> None:
        if self._server is None:
            return

        await asyncio.to_thread(self._server.shutdown)
        self._server.server_close()
        if self._thread is not None:
            self._thread.join(timeout=2)
        logger.info("대화 트리거 HTTP 서버 종료")

    def _create_handler(self):
        owner = self

        class TriggerHandler(BaseHTTPRequestHandler):
            def do_GET(self) -> None:
                parsed_url = urlparse(self.path)
                if parsed_url.path != owner.config.trigger_api_path:
                    self._send_json(HTTPStatus.NOT_FOUND, {"status": "not_found"})
                    return

                if owner._loop is None:
                    self._send_json(HTTPStatus.SERVICE_UNAVAILABLE, {"status": "not_ready"})
                    return

                future = asyncio.run_coroutine_threadsafe(
                    owner.conversation_manager.trigger_conversation(),
                    owner._loop,
                )
                try:
                    started = future.result(timeout=3)
                except Exception:
                    logger.exception("외부 대화 트리거 처리 실패")
                    self._send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"status": "error"})
                    return

                if not started:
                    self._send_json(HTTPStatus.CONFLICT, {"status": "busy"})
                    return

                self._send_json(HTTPStatus.ACCEPTED, {"status": "started"})

            def log_message(self, format: str, *args) -> None:
                logger.info("HTTP %s - %s", self.address_string(), format % args)

            def _send_json(self, status: HTTPStatus, payload: dict[str, str]) -> None:
                body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
                self.send_response(status)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)

        return TriggerHandler
