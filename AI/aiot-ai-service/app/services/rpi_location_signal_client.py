"""
MQTT publisher for location based Raspberry Pi triggers.

This is separate from the existing mqtt_client.py because that file currently
owns conversation-start messages.
"""

import json
import logging
from datetime import datetime
from uuid import uuid4

from app.core.config import settings

logger = logging.getLogger(__name__)


class RPILocationSignalPublishError(Exception):
    """Raised when publishing a location trigger fails."""


def build_location_signal_topic(device_id: str) -> str:
    """Build MQTT topic for a location trigger."""
    topic_template = settings.MQTT_TOPIC_LOCATION_SIGNAL
    return topic_template.replace("{device_id}", device_id).replace("{deviceId}", device_id)


def publish_location_signal(
    device_id: str,
    user_id: str,
    distance_meters: float,
    threshold_meters: float,
    request_id: str | None = None,
) -> tuple[str, str, dict]:
    """
    Publish a location trigger to the Raspberry Pi device.

    Returns:
        tuple[str, str, dict]: topic, request_id, payload
    """
    resolved_request_id = request_id or str(uuid4())
    topic = build_location_signal_topic(device_id)
    payload = {
        "type": "location_trigger",
        "device_id": device_id,
        "user_id": user_id,
        "distance_meters": distance_meters,
        "threshold_meters": threshold_meters,
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
        raise RPILocationSignalPublishError(
            "paho-mqtt package is missing. Run `pip install -r requirements.txt` first."
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
            client_id=f"{settings.MQTT_CLIENT_ID}-location",
            keepalive=settings.MQTT_KEEPALIVE,
        )
    except Exception as exc:
        logger.exception(
            "[location.mqtt] publish failed | host=%s port=%s topic=%s device_id=%s",
            settings.MQTT_HOST,
            settings.MQTT_PORT,
            topic,
            device_id,
        )
        raise RPILocationSignalPublishError("Failed to publish location signal to MQTT broker") from exc

    logger.info(
        "[location.mqtt] publish success | host=%s port=%s topic=%s request_id=%s",
        settings.MQTT_HOST,
        settings.MQTT_PORT,
        topic,
        resolved_request_id,
    )

    return topic, resolved_request_id, payload
