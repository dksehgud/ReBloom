import asyncio
import json
import logging
import urllib.error
import urllib.request

from rpi_client.core.config import Settings

logger = logging.getLogger(__name__)


class ConversationAttemptResultSender:
    """notification-service로 MQTT 대화 시작 시도 결과를 전달한다."""

    def __init__(self, config: Settings) -> None:
        self.url = config.conversation_attempt_result_url
        self.timeout = config.conversation_attempt_result_timeout
        self.serial_number = config.serial_number or config.device_id

    async def send(self, conversation_started: bool) -> None:
        if not self.url:
            return
        if not self.serial_number:
            logger.warning("대화 시도 결과 callback URL은 설정됐지만 serialNumber가 비어 있습니다.")
            return

        await asyncio.to_thread(self._send_blocking, conversation_started)

    def _send_blocking(self, conversation_started: bool) -> None:
        payload = {
            "conversationStarted": conversation_started,
            "serialNumber": self.serial_number,
        }
        request = urllib.request.Request(
            self.url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                response.read()
        except urllib.error.HTTPError as exc:
            logger.warning(
                "대화 시도 결과 callback 실패: status=%s url=%s",
                exc.code,
                self.url,
            )
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            logger.warning("대화 시도 결과 callback 전송 오류: url=%s error=%s", self.url, exc)
        else:
            logger.info("대화 시도 결과 callback 전송 완료: conversationStarted=%s", conversation_started)
