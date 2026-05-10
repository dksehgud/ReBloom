"""
MQTT broker publish 유틸리티.
"""

import json
import logging
from datetime import datetime
from uuid import uuid4

from app.core.config import settings

logger = logging.getLogger(__name__)


class MQTTPublishError(Exception):
    """MQTT publish 실패 예외."""


def build_conversation_start_topic(device_id: str) -> str:
    """환경변수 topic template에서 실제 topic을 생성한다."""
    return (
        settings.MQTT_TOPIC_CONVERSATION_START
        .replace("{deviceId}", device_id)
        .replace("{device_id}", device_id)
    )


def publish_conversation_start(
    device_id: str,
    greeting: str,
    request_id: str | None = None,
) -> tuple[str, str, dict]:
    """
    Raspberry Pi에 대화 시작 명령을 publish 한다.

    Returns:
        tuple[str, str, dict]: (topic, request_id, payload)
    """
    resolved_request_id = request_id or str(uuid4())
    topic = build_conversation_start_topic(device_id)
    payload = {
        "type": "conversation_start",
        "device_id": device_id,
        "greeting": greeting,
        "request_id": resolved_request_id,
        "created_at": datetime.now().astimezone().isoformat(),
    }

    auth = {
        "username": settings.MQTT_USERNAME,
        "password": settings.MQTT_PASSWORD,
    }

    try:
        from paho.mqtt.publish import single
    except ModuleNotFoundError as exc:
        raise MQTTPublishError(
            "paho-mqtt 패키지가 없습니다. `pip install -r requirements.txt`를 먼저 실행해 주세요."
        ) from exc

    try:
        single(
            topic=topic,
            payload=json.dumps(payload, ensure_ascii=False),
            hostname=settings.MQTT_HOST,
            port=settings.MQTT_PORT,
            qos=settings.MQTT_QOS,
            retain=settings.MQTT_RETAIN,
            auth=auth,
            client_id=settings.MQTT_CLIENT_ID,
            keepalive=settings.MQTT_KEEPALIVE,
        )
    except Exception as exc:
        logger.exception(
            "[mqtt] publish 실패 | host=%s port=%s topic=%s device_id=%s",
            settings.MQTT_HOST,
            settings.MQTT_PORT,
            topic,
            device_id,
        )
        raise MQTTPublishError("MQTT broker에 publish 하지 못했습니다.") from exc

    logger.info(
        "[mqtt] publish 성공 | host=%s port=%s topic=%s request_id=%s",
        settings.MQTT_HOST,
        settings.MQTT_PORT,
        topic,
        resolved_request_id,
    )

    return topic, resolved_request_id, payload
