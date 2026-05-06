import io
import json
import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import session_events


class SessionEventSenderTests(unittest.TestCase):
    def test_flush_sends_analysis_payload_shape(self):
        sender = session_events.SessionEventSender(
            url="http://192.168.0.2:8084/api/v1/conversations/sessions/analysis",
            device_id="rebloom-rpi5-test",
            window_seconds=300,
            timeout=5,
        )
        sender.session_id = "session-20260504-165130"
        sender.started_at = "2026-05-04T16:51:30+09:00"
        sender.append("user", "안녕, 지금 서버 송신 테스트 중이야")
        sender.append("assistant", "응, 서버로 잘 보내지고 있어.")
        sender.append("user", "좋아, 다음 테스트도 해볼게.")

        with mock.patch.object(session_events, "now_iso", return_value="2026-05-04T16:51:42+09:00"):
            with mock.patch.object(session_events.urllib.request, "urlopen", return_value=_FakeResponse()) as urlopen:
                self.assertTrue(sender.flush(force=True))

        request = urlopen.call_args.args[0]
        payload = json.loads(request.data.decode("utf-8"))

        self.assertEqual(request.full_url, "http://192.168.0.2:8084/api/v1/conversations/sessions/analysis")
        self.assertEqual(request.headers["Content-type"], "application/json")
        self.assertEqual(
            payload,
            {
                "session_id": "session-20260504-165130",
                "raspberrypi_id": "rebloom-rpi5-test",
                "started_at": "2026-05-04T16:51:30+09:00",
                "ended_at": "2026-05-04T16:51:42+09:00",
                "events": [
                    {"child": "안녕, 지금 서버 송신 테스트 중이야"},
                    {"bot": "응, 서버로 잘 보내지고 있어."},
                    {"child": "좋아, 다음 테스트도 해볼게."},
                ],
            },
        )


class _FakeResponse:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def read(self):
        return io.BytesIO(b"{}").read()


if __name__ == "__main__":
    unittest.main()
