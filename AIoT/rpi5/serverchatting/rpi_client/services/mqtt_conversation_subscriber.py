import asyncio
import json
import logging
from typing import TYPE_CHECKING, Any

import paho.mqtt.client as mqtt

from rpi_client.core.config import Settings
from rpi_client.services.conversation_manager import ConversationManager

if TYPE_CHECKING:
    from rpi_client.services.ir_sensor_monitor import IRSensorMonitor

logger = logging.getLogger(__name__)


class MQTTConversationSubscriber:
    """MQTT 대화 시작 토픽을 구독하고 기존 대화 트리거로 연결한다."""

    def __init__(
        self,
        config: Settings,
        conversation_manager: ConversationManager,
        ir_sensor_monitor: "IRSensorMonitor | None" = None,
    ) -> None:
        self.config = config
        self.conversation_manager = conversation_manager
        self._ir_sensor_monitor = ir_sensor_monitor
        self._loop: asyncio.AbstractEventLoop | None = None
        self._client: mqtt.Client | None = None
        self._subscribed_event: asyncio.Event | None = None

    async def start(self) -> None:
        if not self.config.mqtt_enabled:
            logger.info("MQTT 구독 비활성화")
            return
        if not self.config.mqtt_host:
            logger.warning("MQTT_ENABLED=true 이지만 MQTT_HOST가 비어 있어 구독을 시작하지 않습니다.")
            return
        if not self.config.mqtt_conversation_start_topic:
            logger.warning("MQTT_CONVERSATION_START_TOPIC이 비어 있어 구독을 시작하지 않습니다.")
            return

        self._loop = asyncio.get_running_loop()
        self._subscribed_event = asyncio.Event()
        client_id = self.config.mqtt_client_id or f"{self.config.device_id}-conversation-subscriber"
        self._client = mqtt.Client(client_id=client_id)
        if self.config.mqtt_username:
            self._client.username_pw_set(self.config.mqtt_username, self.config.mqtt_password)

        self._client.on_connect = self._on_connect
        self._client.on_disconnect = self._on_disconnect
        self._client.on_message = self._on_message
        self._client.reconnect_delay_set(min_delay=1, max_delay=30)

        self._client.connect_async(
            self.config.mqtt_host,
            self.config.mqtt_port,
            keepalive=self.config.mqtt_keepalive_seconds,
        )
        self._client.loop_start()
        logger.info(
            "MQTT 구독 시작: %s:%d topic=%s",
            self.config.mqtt_host,
            self.config.mqtt_port,
            self.config.mqtt_conversation_start_topic,
        )
        await self._wait_until_subscribed()

    async def stop(self) -> None:
        if self._client is None:
            return

        await asyncio.to_thread(self._client.disconnect)
        self._client.loop_stop()
        logger.info("MQTT 구독 종료")

    def _on_connect(self, client: mqtt.Client, _userdata: Any, _flags: Any, reason_code: Any, *_args: Any) -> None:
        if self._reason_code_value(reason_code) != 0:
            logger.warning("MQTT 연결 실패: reason_code=%s", reason_code)
            return

        logger.info("MQTT 연결 성공")
        client.subscribe(self.config.mqtt_conversation_start_topic, qos=1)
        logger.info("MQTT topic 구독 완료: %s", self.config.mqtt_conversation_start_topic)
        self._notify_subscribed()

    def _on_disconnect(self, _client: mqtt.Client, _userdata: Any, reason_code: Any, *_args: Any) -> None:
        if self._reason_code_value(reason_code) == 0:
            logger.info("MQTT 연결 종료")
            return
        logger.warning("MQTT 연결 끊김, 자동 재연결 대기: reason_code=%s", reason_code)

    def _on_message(self, _client: mqtt.Client, _userdata: Any, message: mqtt.MQTTMessage) -> None:
        payload_text = message.payload.decode("utf-8", errors="replace").strip()
        logger.info("MQTT 메시지 수신: topic=%s payload=%s", message.topic, payload_text)

        greeting = self._extract_greeting(payload_text)
        if greeting is None:
            return

        if self._loop is None:
            logger.warning("MQTT 메시지를 받았지만 이벤트 루프가 준비되지 않았습니다.")
            return

        if self._ir_sensor_monitor is not None:
            # IR 센서가 활성화된 경우: 움직임이 감지될 때까지 대기 후 트리거
            future = asyncio.run_coroutine_threadsafe(
                self._wait_for_motion_then_trigger(greeting),
                self._loop,
            )
        else:
            future = asyncio.run_coroutine_threadsafe(
                self.conversation_manager.trigger_conversation(greeting=greeting),
                self._loop,
            )
        future.add_done_callback(self._log_trigger_result)

    async def _wait_for_motion_then_trigger(self, greeting: str) -> bool:
        assert self._ir_sensor_monitor is not None
        timeout = self.config.ir_motion_timeout_seconds
        print(f"[MQTT] IR 센서 움직임 감지 대기 중 (최대 {timeout:.0f}초)...", flush=True)

        motion_detected = await self._ir_sensor_monitor.wait_for_motion(timeout)

        if not motion_detected:
            logger.info("IR 센서: %.0f초 동안 움직임이 없어 MQTT 대화 트리거를 건너뜁니다.", timeout)
            print(f"[MQTT] {timeout:.0f}초 동안 움직임 없음 — 대화 시작 생략", flush=True)
            return False

        print("[MQTT] IR 센서 움직임 감지 — 대화 시작", flush=True)
        return await self.conversation_manager.trigger_conversation(greeting=greeting)

    def _extract_greeting(self, payload_text: str) -> str | None:
        if not payload_text:
            return self.config.trigger_greeting

        try:
            payload = json.loads(payload_text)
        except json.JSONDecodeError:
            logger.warning("MQTT payload가 JSON이 아니므로 기본 인사말로 대화를 시작합니다.")
            return self.config.trigger_greeting

        if not isinstance(payload, dict):
            logger.warning("MQTT payload JSON이 객체가 아닙니다.")
            return None

        message_type = str(payload.get("type", "conversation_start")).strip()
        if message_type != "conversation_start":
            logger.info("대화 시작 메시지가 아니라 무시합니다: type=%s", message_type)
            return None

        payload_device_id = str(payload.get("device_id", self.config.device_id)).strip()
        if payload_device_id and payload_device_id != self.config.device_id:
            logger.info("다른 기기 대상 MQTT 메시지라 무시합니다: device_id=%s", payload_device_id)
            return None

        greeting = str(payload.get("greeting", self.config.trigger_greeting)).strip()
        return greeting or self.config.trigger_greeting

    @staticmethod
    def _log_trigger_result(future: asyncio.Future[bool]) -> None:
        try:
            started = future.result()
        except Exception:
            logger.exception("MQTT 대화 트리거 처리 실패")
            return

        if started:
            logger.info("MQTT 대화 트리거 시작 완료")
        else:
            logger.info("이미 대화 중이라 MQTT 대화 트리거를 건너뜁니다.")

    async def _wait_until_subscribed(self) -> None:
        if self._subscribed_event is None:
            return
        try:
            await asyncio.wait_for(self._subscribed_event.wait(), timeout=5)
        except asyncio.TimeoutError:
            logger.warning("MQTT 구독 완료 대기 시간이 초과되었습니다. 백그라운드에서 계속 재연결합니다.")

    def _notify_subscribed(self) -> None:
        if self._loop is None or self._subscribed_event is None:
            return
        self._loop.call_soon_threadsafe(self._subscribed_event.set)

    @staticmethod
    def _reason_code_value(reason_code: Any) -> int:
        value = getattr(reason_code, "value", reason_code)
        try:
            return int(value)
        except (TypeError, ValueError):
            return -1
