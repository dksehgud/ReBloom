import json
import logging
import threading
from datetime import datetime, timezone

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
from app.kafka.producer import publish_anomaly_verified, publish_phq_result

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
    rebloom.ai.analyze.requested.v1 처리

    payload:
        {
          "userId"    : "string",
          "age"       : int | null,
          "biometrics": [ ... ],
          "sleeps"    : [ ... 14일치 or [] ]
        }

    sleeps 있으면 → PHQ 예측 + IF 재학습 → rebloom.phq.result.v1 발행
    sleeps 없으면 → IF 재학습만
    """
    user_id    = payload.get("userId")
    age        = payload.get("age")        # ← 추가
    biometrics = payload.get("biometrics", [])
    sleeps     = payload.get("sleeps", [])

    if not biometrics:
        logger.warning("[ai.analyze] biometrics 없음 | userId=%s", user_id)
        return

    if sleeps:
        # ── PHQ 예측 + IF 재학습 ────────────────────────────
        logger.info("[ai.analyze] PHQ 예측 + IF 재학습 시작 | userId=%s", user_id)

        result = phq.analyze_and_retrain(
            user_id    = user_id,
            age        = age,              # ← 추가
            sleeps     = sleeps,
            biometrics = biometrics,
        )

        publish_phq_result(
            user_id      = user_id,
            date         = datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            result       = result["phq_result"],
            score        = result["phq_score"],
            predicted_at = datetime.now(timezone.utc).isoformat(),
        )
        logger.info("[ai.analyze] PHQ 예측 완료 | userId=%s result=%s score=%s",
                    user_id, result["phq_result"], result["phq_score"])

    else:
        # ── IF 재학습만 ────────────────────────────────────
        logger.info("[ai.analyze] IF 재학습만 시작 | userId=%s", user_id)

        if_model.train_if_model(
            user_id      = user_id,
            records      = biometrics,
            contamination= 0.01,
        )
        logger.info("[ai.analyze] IF 재학습 완료 | userId=%s", user_id)


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