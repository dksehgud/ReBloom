import json
import logging
import threading

import redis
from confluent_kafka import Consumer, KafkaError, KafkaException

from app.config.settings import (
    KAFKA_BOOTSTRAP_SERVERS,
    KAFKA_GROUP_ID,
    KAFKA_TOPIC_BIOMETRIC_RAW,
    KAFKA_TOPIC_AI_TRAIN,
    KAFKA_TOPIC_AI_ANALYZE,
    REDIS_HOST,
    REDIS_PORT,
)
from app.service import anomaly, if_model, phq
from app.kafka.producer import publish_anomaly_verified

logger = logging.getLogger(__name__)

# 임계치 기반 → IF 전환 기준 건수
IF_READY_THRESHOLD = 288

# ──────────────────────────────────────────────
# Redis 클라이언트 (biometric_count 조회용)
# ──────────────────────────────────────────────
_redis: redis.Redis | None = None


def _get_redis() -> redis.Redis:
    global _redis
    if _redis is None:
        _redis = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    return _redis


def _get_biometric_count(user_id: str) -> int:
    """Redis에서 유저별 biometric 수집 건수 조회"""
    try:
        val = _get_redis().get(f"biometric_count:{user_id}")
        return int(val) if val else 0
    except Exception as e:
        logger.warning("[Redis] biometric_count 조회 실패 | userId=%s err=%s", user_id, e)
        return 0


# ──────────────────────────────────────────────
# 토픽별 핸들러
# ──────────────────────────────────────────────

def _handle_biometric_raw(payload: dict) -> None:
    """
    rebloom.biometric.raw.v1 처리

    biometric_count < 288  → 임계치 기반 이상치 탐지 (anomaly.py)
    biometric_count >= 288 → IF 모델 이상치 탐지 (if_model.py)
    이상치 확정 시 → rebloom.anomaly.verified.v1 발행
    """
    user_id = payload["userId"]
    records: list[dict] = payload.get("records", [])

    if not records:
        logger.warning("[biometric.raw] records 없음 | userId=%s", user_id)
        return

    count = _get_biometric_count(user_id)
    logger.info("[biometric.raw] userId=%s biometric_count=%d records=%d",
                user_id, count, len(records))

    for record in records:
        hr           = record["hr"]
        rmssd        = record["rmssd"]
        pnn50        = record["pnn50"]
        lf_hf        = record["lfHf"]
        acc_mag      = record["accMag"]
        hr_acc_ratio = record["hrAccRatio"]
        ts_start     = record["tsStart"]

        if count < IF_READY_THRESHOLD:
            # ── Phase 1: 임계치 기반 탐지 ──────────────────
            result = anomaly.detect_anomaly(
                hr=hr,
                rmssd=rmssd,
                pnn50=pnn50,
                lf_hf=lf_hf,
                acc_mag=acc_mag,
                hr_acc_ratio=hr_acc_ratio,
            )
            logger.debug("[Phase1] userId=%s is_anomaly=%s", user_id, result["is_anomaly"])

        else:
            # ── Phase 2: IF 모델 탐지 ──────────────────────
            result = if_model.predict_if(
                user_id=user_id,
                hr=hr,
                rmssd=rmssd,
                pnn50=pnn50,
                lf_hf=lf_hf,
                acc_mag=acc_mag,
                hr_acc_ratio=hr_acc_ratio,
            )
            logger.debug("[Phase2] userId=%s is_anomaly=%s", user_id, result["is_anomaly"])

        # ── 이상치 확정 시 Kafka 발행 ──────────────────────
        if result["is_anomaly"]:
            publish_anomaly_verified(
                user_id         = user_id,
                ts_start        = ts_start,
                anomaly_features= result.get("anomaly_features", []),
            )


def _handle_ai_train(payload: dict) -> None:
    """
    rebloom.ai.train.requested.v1 처리

    Biometric Service → 288건 달성 시 최초 IF 학습 요청
    payload 예시:
        {
          "userId"       : "uuid",
          "contamination": 0.01,
          "records"      : [ {hr, rmssd, pnn50, lfHf, accMag, hrAccRatio}, ... ]
        }
    """
    user_id       = payload["userId"]
    contamination = payload.get("contamination", 0.01)
    records       = payload.get("records", [])

    if not records:
        logger.warning("[ai.train] records 없음 | userId=%s", user_id)
        return

    logger.info("[ai.train] IF 최초 학습 시작 | userId=%s records=%d contamination=%s",
                user_id, len(records), contamination)

    if_model.train_if_model(
        user_id=user_id,
        records=records,
        contamination=contamination,
    )
    logger.info("[ai.train] IF 최초 학습 완료 | userId=%s", user_id)


def _handle_ai_analyze(payload: dict) -> None:
    """
    rebloom.ai.analyze.v1 처리

    Biometric Service → 수면 데이터 PATCH 후 PHQ 예측 + IF 재학습 요청
    payload 예시:
        {
          "userId"  : "uuid",
          "features": { "sleep_duration_std": 1.2, ... }
        }
    """
    user_id  = payload["userId"]
    features = payload.get("features", {})

    if not features:
        logger.warning("[ai.analyze] features 없음 | userId=%s", user_id)
        return

    logger.info("[ai.analyze] PHQ 예측 + IF 재학습 시작 | userId=%s", user_id)

    # PHQ 예측 + contamination에 따른 IF 재학습 (phq.py 내부에서 처리)
    result = phq.predict_phq_and_retrain(user_id=user_id, features=features)

    logger.info("[ai.analyze] 완료 | userId=%s phq_result=%s phq_score=%s",
                user_id, result.get("phq_result"), result.get("phq_score"))


# ──────────────────────────────────────────────
# Consumer 루프
# ──────────────────────────────────────────────

_stop_event = threading.Event()


def _consume_loop() -> None:
    """
    Kafka Consumer 메인 루프 (별도 스레드에서 실행)
    구독 토픽:
        - rebloom.biometric.raw.v1
        - rebloom.ai.train.requested.v1
        - rebloom.ai.analyze.v1
    """
    consumer = Consumer({
        "bootstrap.servers"  : KAFKA_BOOTSTRAP_SERVERS,
        "group.id"           : KAFKA_GROUP_ID,
        "auto.offset.reset"  : "latest",      # 서비스 시작 이후 메시지만 수신
        "enable.auto.commit" : True,
        "auto.commit.interval.ms": 5000,
    })

    topics = [
        KAFKA_TOPIC_BIOMETRIC_RAW,
        KAFKA_TOPIC_AI_TRAIN,
        KAFKA_TOPIC_AI_ANALYZE,
    ]
    consumer.subscribe(topics)
    logger.info("[Kafka] Consumer 구독 시작 | topics=%s", topics)

    # 토픽 → 핸들러 라우팅 테이블
    handlers = {
        KAFKA_TOPIC_BIOMETRIC_RAW : _handle_biometric_raw,
        KAFKA_TOPIC_AI_TRAIN      : _handle_ai_train,
        KAFKA_TOPIC_AI_ANALYZE    : _handle_ai_analyze,
    }

    try:
        while not _stop_event.is_set():
            msg = consumer.poll(timeout=1.0)

            if msg is None:
                continue

            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    # 파티션 끝 도달 (정상)
                    continue
                raise KafkaException(msg.error())

            topic   = msg.topic()
            raw_val = msg.value()

            try:
                payload = json.loads(raw_val)
            except (json.JSONDecodeError, TypeError) as e:
                logger.error("[Kafka] JSON 파싱 실패 | topic=%s err=%s raw=%s",
                             topic, e, raw_val)
                continue

            handler = handlers.get(topic)
            if handler is None:
                logger.warning("[Kafka] 핸들러 없음 | topic=%s", topic)
                continue

            try:
                handler(payload)
            except Exception as e:
                logger.exception("[Kafka] 핸들러 예외 | topic=%s userId=%s err=%s",
                                 topic, payload.get("userId"), e)

    finally:
        consumer.close()
        logger.info("[Kafka] Consumer 종료")


# ──────────────────────────────────────────────
# 외부 인터페이스
# ──────────────────────────────────────────────

_consumer_thread: threading.Thread | None = None


def start_consumer() -> None:
    """FastAPI lifespan에서 호출 — Consumer 스레드 시작"""
    global _consumer_thread
    _stop_event.clear()
    _consumer_thread = threading.Thread(target=_consume_loop, daemon=True, name="kafka-consumer")
    _consumer_thread.start()
    logger.info("[Kafka] Consumer 스레드 시작")


def stop_consumer() -> None:
    """FastAPI lifespan 종료 시 호출 — Consumer 스레드 정지"""
    _stop_event.set()
    if _consumer_thread and _consumer_thread.is_alive():
        _consumer_thread.join(timeout=10)
    logger.info("[Kafka] Consumer 스레드 종료")