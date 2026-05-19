import json
import logging
from confluent_kafka import Producer
from datetime import datetime
from uuid import uuid4
from zoneinfo import ZoneInfo

from app.config.settings import (
    KAFKA_BOOTSTRAP_SERVERS,
    KAFKA_TOPIC_ANOMALY_VERIFIED,
    KAFKA_TOPIC_PHQ_RESULT,
    KAFKA_TOPIC_STATUS_CARD_CREATED,
)

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
# Producer 싱글턴
# ──────────────────────────────────────────────
_producer: Producer | None = None


def get_producer() -> Producer:
    """confluent_kafka Producer 싱글턴 반환"""
    global _producer
    if _producer is None:
        _producer = Producer({"bootstrap.servers": KAFKA_BOOTSTRAP_SERVERS})
    return _producer


def _delivery_report(err, msg) -> None:
    """메시지 전송 결과 콜백"""
    if err:
        logger.error("[Kafka] 발행 실패 | topic=%s err=%s", msg.topic(), err)
    else:
        logger.debug("[Kafka] 발행 성공 | topic=%s partition=%d offset=%d",
                     msg.topic(), msg.partition(), msg.offset())


# ──────────────────────────────────────────────
# 발행 함수
# ──────────────────────────────────────────────

def publish_anomaly_verified(
    user_id         : str,
    ts_start        : str,
    ts_end          : str,
    hr              : float,
    rmssd           : float,
    pnn50           : float,
    lf_hf           : float,
    acc_mag         : float,
    hr_acc_ratio    : float,
    is_anomaly      : bool,
    anomaly_features: list[str],
) -> None:
    """
    rebloom.anomaly.analysed.v1 발행

    Args:
        user_id         : 유저 UUID
        ts_start        : 구간 시작 시각 (ISO 8601)
        ts_end          : 구간 종료 시각 (ISO 8601)
        hr              : 심박수
        rmssd           : HRV rmssd
        pnn50           : HRV pnn50
        lf_hf           : LF/HF ratio
        acc_mag         : 가속도 크기
        hr_acc_ratio    : 심박수/가속도 비율
        is_anomaly      : 이상치 여부
        anomaly_features: 이상치로 판단된 변수명 목록
    """
    payload = {
        "userId"         : user_id,
        "tsStart"        : ts_start,
        "tsEnd"          : ts_end,
        "hr"             : hr,
        "rmssd"          : rmssd,
        "pnn50"          : pnn50,
        "lfHf"           : lf_hf,
        "accMag"         : acc_mag,
        "hrAccRatio"     : hr_acc_ratio,
        "isAnomaly"      : is_anomaly,
    }
    envelope = _event_envelope(
        event_type="ANOMALY_ANALYSED",
        payload=payload,
        idempotency_key=f"ANOMALY_ANALYSED:{user_id}:{ts_start}",
    )

    producer = get_producer()
    producer.produce(
        topic    = KAFKA_TOPIC_ANOMALY_VERIFIED,
        key      = user_id,
        value    = json.dumps(envelope, ensure_ascii=False),
        callback = _delivery_report,
    )
    producer.poll(0)
    logger.info("[Kafka] anomaly.analysed 발행 | userId=%s features=%s", user_id, anomaly_features)

def publish_phq_result(user_id: str, date: str, result: int, score: float, predicted_at: str) -> None:
    """
    rebloom.phq.completed.v1 발행

    Args:
        user_id     : 유저 UUID
        date        : 예측 기준 날짜 (YYYY-MM-DD)
        result      : PHQ 예측 결과 (0: 정상, 1: 위험)
        score       : PHQ 예측 확률 (0.0 ~ 1.0)
        predicted_at: 예측 시각 (ISO 8601)
    """
    payload = {
        "userId"     : user_id,
        "date"       : date,
        "result"     : result,
        "score"      : score,
        "predictedAt": predicted_at,
    }
    envelope = _event_envelope(
        event_type="PHQ_COMPLETED",
        payload=payload,
        idempotency_key=f"PHQ_COMPLETED:{user_id}:{date}",
    )

    producer = get_producer()
    producer.produce(
        topic    = KAFKA_TOPIC_PHQ_RESULT,
        key      = user_id,
        value    = json.dumps(envelope, ensure_ascii=False),
        callback = _delivery_report,
    )
    producer.poll(0)
    logger.info("[Kafka] phq.completed 발행 | userId=%s result=%s score=%s", user_id, result, score)


# status cards
def _now_seoul_datetime() -> str:
    return datetime.now(ZoneInfo("Asia/Seoul")).replace(microsecond=0).isoformat()


def _event_envelope(
    event_type: str,
    payload: dict,
    correlation_id: str | None = None,
    idempotency_key: str | None = None,
) -> dict:
    return {
        "eventId": str(uuid4()),
        "eventType": event_type,
        "eventVersion": "v1",
        "producer": "bio-ml-service",
        "correlationId": correlation_id,
        "idempotencyKey": idempotency_key,
        "occurredAt": _now_seoul_datetime(),
        "payload": payload,
    }


def publish_status_card_created(
    user_id: str,
    date: str,
    title: str,
    description: str,
    sub_title: str,
    suggestion: str,
    correlation_id: str | None = None,
) -> None:
    payload = {
        "userId": user_id,
        "date": date,
        "title": title,
        "description": description,
        "subTitle": sub_title,
        "suggestion": suggestion,
    }
    envelope = _event_envelope(
        event_type="STATUS_CARD_CREATED",
        payload=payload,
        correlation_id=correlation_id,
        idempotency_key=f"STATUS_CARD_CREATED:{user_id}:{date}",
    )

    producer = get_producer()
    producer.produce(
        topic=KAFKA_TOPIC_STATUS_CARD_CREATED,
        key=user_id,
        value=json.dumps(envelope, ensure_ascii=False),
        callback=_delivery_report,
    )
    producer.poll(0)
    logger.info("[Kafka] status-card.created published | userId=%s date=%s", user_id, date)

def flush() -> None:
    """종료 전 미전송 메시지 플러시"""
    if _producer:
        _producer.flush()
