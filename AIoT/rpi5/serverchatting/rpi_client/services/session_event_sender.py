import asyncio
import http.client
import json
import logging
import socket
import time
import urllib.error
import urllib.request
import uuid
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)


def now_iso() -> str:
    return datetime.now().astimezone().isoformat(timespec="seconds")


def make_session_id() -> str:
    return str(uuid.uuid4())


class SessionEventSender:
    """대화 내역을 일정 주기마다 서버로 전송한다."""

    def __init__(
        self,
        url: str = "",
        device_id: str = "",
        window_seconds: float = 300,
        timeout: float = 5,
        session_id: Optional[str] = None,
        auth_header: str = "Authorization",
        auth_token: str = "",
        auth_scheme: str = "Bearer",
    ) -> None:
        self.url = url
        self.device_id = device_id or socket.gethostname()
        self.auth_header = auth_header
        self.auth_token = auth_token
        self.auth_scheme = auth_scheme
        self.window_seconds = window_seconds
        self.timeout = timeout
        self.session_id = session_id or make_session_id()
        self.started_at = now_iso()
        self.window_started_monotonic = time.monotonic()
        self.events: list[dict[str, str]] = []
        self.last_error = ""

    @property
    def enabled(self) -> bool:
        return bool(self.url)

    def append(self, role: str, content: str) -> None:
        """대화 이벤트를 메모리에 추가한다."""

        if not self.enabled:
            return

        if role == "user":
            self.events.append({"child": content})
        elif role == "assistant":
            if self.events and "bot" not in self.events[-1]:
                self.events[-1]["bot"] = content
            else:
                self.events.append({"bot": content})

    async def flush_if_due(self) -> bool:
        """전송 주기가 지났으면 대화 이벤트를 서버로 보낸다."""

        if time.monotonic() - self.window_started_monotonic >= self.window_seconds:
            return await self.flush()
        return True

    async def flush(self, force: bool = False) -> bool:
        """대화 이벤트를 서버로 전송한다."""

        if not self.enabled or not self.events:
            return True
        if not force and time.monotonic() - self.window_started_monotonic < self.window_seconds:
            return True

        payload = {
            "session_id": self.session_id,
            "raspberrypi_id": self.device_id,
            "started_at": self.started_at,
            "ended_at": now_iso(),
            "events": self.events,
        }

        ok = await asyncio.to_thread(self._post_payload, payload)
        if not ok:
            logger.warning("대화 이벤트 전송 실패: %s", self.last_error)
            return False

        logger.info("대화 이벤트 전송 완료: %d개", len(self.events))
        print(f"[세션] 대화 이벤트 전송 완료: {len(self.events)}개", flush=True)
        self.events = []
        self.session_id = make_session_id()
        self.started_at = now_iso()
        self.window_started_monotonic = time.monotonic()
        return True

    def _post_payload(self, payload: dict) -> bool:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        headers = {"Content-Type": "application/json"}
        if self.auth_header and self.auth_token:
            if self.auth_scheme:
                headers[self.auth_header] = f"{self.auth_scheme} {self.auth_token}"
            else:
                headers[self.auth_header] = self.auth_token

        request = urllib.request.Request(
            self.url,
            data=data,
            headers=headers,
            method="POST",
        )

        try:
            with urllib.request.urlopen(request, timeout=self.timeout):
                pass
        except (
            http.client.HTTPException,
            OSError,
            TimeoutError,
            urllib.error.URLError,
            urllib.error.HTTPError,
        ) as exc:
            self.last_error = str(exc)
            return False

        self.last_error = ""
        return True
