"""
MQTT publish 예제 라우터.
"""

import logging

from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool

from app.schemas.mqtt import (
    ConversationStartPublishRequest,
    ConversationStartPublishResponse,
)
from app.services.mqtt_client import MQTTPublishError, publish_conversation_start

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/mqtt", tags=["mqtt"])


@router.post(
    "/conversation/start",
    response_model=ConversationStartPublishResponse,
)
async def mqtt_conversation_start(
    request: ConversationStartPublishRequest,
) -> ConversationStartPublishResponse:
    """Raspberry Pi에 대화 시작 명령을 MQTT로 publish 한다."""
    logger.info(
        "[mqtt] publish 요청 수신 | device_id=%s greeting=%r",
        request.device_id,
        request.greeting,
    )

    try:
        topic, request_id, payload = await run_in_threadpool(
            publish_conversation_start,
            request.device_id,
            request.greeting,
            request.request_id,
        )
    except MQTTPublishError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return ConversationStartPublishResponse(
        status="published",
        topic=topic,
        request_id=request_id,
        payload=payload,
    )
