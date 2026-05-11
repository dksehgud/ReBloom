import json
import logging
from confluent_kafka import Producer

from app.config.settings import (
    KAFKA_BOOTSTRAP_SERVERS,
    KAFKA_TOPIC_ANOMALY_VERIFIED,
    KAFKA_TOPIC_PHQ_RESULT,
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

def publish_anomaly_verified(user_id: str, ts_start: str, anomaly_features: list[str]) -> None:
    """
    rebloom.anomaly.verified.v1 발행

    Args:
        user_id         : 유저 UUID
        ts_start        : 이상치 발생 구간 시작 시각 (ISO 8601)
        anomaly_features: 이상치로 판단된 변수명 목록
    """
    payload = {
        "userId"         : user_id,
        "tsStart"        : ts_start,
        "anomalyFeatures": anomaly_features,
    }
    producer = get_producer()
    producer.produce(
        topic    = KAFKA_TOPIC_ANOMALY_VERIFIED,
        key      = user_id,
        value    = json.dumps(payload),
        callback = _delivery_report,
    )
    producer.poll(0)
    logger.info("[Kafka] anomaly.verified 발행 | userId=%s features=%s", user_id, anomaly_features)


def publish_phq_result(user_id: str, date: str, result: int, score: float, predicted_at: str) -> None:
    """
    rebloom.phq.result.v1 발행

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
    producer = get_producer()
    producer.produce(
        topic    = KAFKA_TOPIC_PHQ_RESULT,
        key      = user_id,
        value    = json.dumps(payload),
        callback = _delivery_report,
    )
    producer.poll(0)
    logger.info("[Kafka] phq.result 발행 | userId=%s result=%s score=%s", user_id, result, score)


def flush() -> None:
    """종료 전 미전송 메시지 플러시"""
    if _producer:
        _producer.flush()