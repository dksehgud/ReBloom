import json
import http.client
import socket
import time
import urllib.error
import urllib.request
from datetime import datetime


DEFAULT_SESSION_WINDOW_SECONDS = 300


def now_iso():
    return datetime.now().astimezone().isoformat(timespec="seconds")


def make_session_id():
    timestamp = datetime.now().astimezone().strftime("%Y%m%d-%H%M%S")
    return f"session-{timestamp}"


class SessionEventSender:
    def __init__(
        self,
        url="",
        device_id="",
        window_seconds=DEFAULT_SESSION_WINDOW_SECONDS,
        timeout=5,
    ):
        self.url = url
        self.device_id = device_id or socket.gethostname()
        self.window_seconds = window_seconds
        self.timeout = timeout
        self.session_id = make_session_id()
        self.started_at = now_iso()
        self.window_started_monotonic = time.monotonic()
        self.events = []
        self.last_error = ""

    @property
    def enabled(self):
        return bool(self.url)

    def append_text(self, speaker, text):
        if not self.enabled:
            return
        self.events.append({speaker: text})

    def append(self, role, content):
        if role == "user":
            self.append_text("child", content)
        elif role == "assistant":
            self.append_text("bot", content)

    def flush_if_due(self):
        if time.monotonic() - self.window_started_monotonic >= self.window_seconds:
            return self.flush()
        return True

    def flush(self, force=False):
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
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        request = urllib.request.Request(
            self.url,
            data=data,
            headers={"Content-Type": "application/json"},
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
        self.events = []
        self.session_id = make_session_id()
        self.started_at = now_iso()
        self.window_started_monotonic = time.monotonic()
        return True
