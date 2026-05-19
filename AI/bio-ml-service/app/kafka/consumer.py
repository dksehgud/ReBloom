import json
import logging
import threading
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

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
    KAFKA_TOPIC_STATUS_CARD_REQUESTED,
)
from app.service import anomaly, if_model, phq, status_card
from app.kafka.producer import publish_anomaly_verified, publish_phq_result, publish_status_card_created

logger = logging.getLogger(__name__)

# IBI 부족으로 계산 불가 시 사용하는 논문 데이터 중앙값 (탐지 판단 전용)
_LF_HF_MEDIAN = 0.616
_PNN50_MEDIAN = 0.429

# ──────────────────────────────────────────────
# Redis 클라이언트 (biometric_train_requested 조회용)
# ──────────────────────────────────────────────
_redis: redis.Redis | None = None


def _get_redis() -> redis.Redis:
    global _redis
    if _redis is None:
        _redis = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    return _redis


def _unwrap_event_envelope(message: dict) -> dict:
    if isinstance(message, dict) and isinstance(message.get("payload"), dict):
        return message["payload"]
    return message


def _normalize_biometrics(biometrics: list[dict]) -> list[dict]:
    """camelCase → snake_case 변환 + sentinel 행 제거 (lf_hf=-1, pnn50=1.0)"""
    return [
        {
            "hr"          : b.get("hr"),
            "rmssd"       : b.get("rmssd"),
            "pnn50"       : b.get("pnn50"),
            "lf_hf"       : b.get("lfHf"),
            "acc_mag"     : b.get("accMag"),
            "hr_acc_ratio": b.get("hrAccRatio"),
        }
        for b in biometrics
        if b.get("lfHf") != -1 and b.get("pnn50") != 1.0
    ]


def _is_if_model_ready(user_id: str) -> bool:
    try:
        return _get_redis().exists(f"biometric_train_requested:{user_id}") == 1
    except Exception as e:
        logger.warning("[Redis] biometric_train_requested 조회 실패 | userId=%s err=%s", user_id, e)
        return False


def _today_seoul() -> str:
    return datetime.now(ZoneInfo("Asia/Seoul")).date().isoformat()


# ──────────────────────────────────────────────
# 토픽별 핸들러
# ──────────────────────────────────────────────

def _handle_biometric_raw(payload: dict) -> None:
    payload = _unwrap_event_envelope(payload)

    user_id      = payload["userId"]
    hr           = payload["hr"]
    rmssd        = payload["rmssd"]
    pnn50_raw    = payload["pnn50"]
    lf_hf_raw    = payload["lfHf"]
    acc_mag      = payload["accMag"]
    hr_acc_ratio = payload["hrAccRatio"]
    ts_start     = payload["tsStart"]
    ts_end       = payload["tsEnd"]

    # sentinel이면 중앙값으로 대체 — 탐지 판단에만 사용, DB 적재는 pnn50_raw/lf_hf_raw
    pnn50 = pnn50_raw if pnn50_raw != 1.0 else _PNN50_MEDIAN
    lf_hf = lf_hf_raw if lf_hf_raw != -1  else _LF_HF_MEDIAN

    if_ready = _is_if_model_ready(user_id)
    logger.info("[biometric.raw] userId=%s if_model_ready=%s", user_id, if_ready)

    if not if_ready:
        result = anomaly.detect_anomaly(
            hr=hr, rmssd=rmssd, pnn50=pnn50,
            lf_hf=lf_hf, acc_mag=acc_mag, hr_acc_ratio=hr_acc_ratio,
        )
        logger.info("[Phase1] userId=%s is_anomaly=%s", user_id, result["is_anomaly"])
    else:
        result = if_model.predict_if_model(
            user_id=user_id,
            biometric={
                "hr": hr, "rmssd": rmssd, "pnn50": pnn50,
                "lf_hf": lf_hf, "acc_mag": acc_mag, "hr_acc_ratio": hr_acc_ratio,
            }
        )
        logger.info("[Phase2] userId=%s is_anomaly=%s", user_id, result["is_anomaly"])

    publish_anomaly_verified(
        user_id          = user_id,
        ts_start         = ts_start,
        ts_end           = ts_end,
        hr               = hr,
        rmssd            = rmssd,
        pnn50            = pnn50_raw,
        lf_hf            = lf_hf_raw,
        acc_mag          = acc_mag,
        hr_acc_ratio     = hr_acc_ratio,
        is_anomaly       = result["is_anomaly"],
        anomaly_features = result.get("anomaly_features", []),
    )


def _handle_ai_train(payload: dict) -> None:
    payload = _unwrap_event_envelope(payload)

    user_id    = payload.get("userId")
    biometrics = payload.get("biometrics", [])

    if not biometrics:
        logger.warning("[ai.train] biometrics 없음 | userId=%s", user_id)
        return

    logger.info("[ai.train] IF 최초 학습 시작 | userId=%s biometrics=%d", user_id, len(biometrics))
    if_model.train_if_model(
        user_id       = user_id,
        biometrics    = _normalize_biometrics(biometrics),
        contamination = payload.get("contamination", 0.01),
    )
    logger.info("[ai.train] IF 최초 학습 완료 | userId=%s", user_id)


def _handle_ai_analyze(payload: dict) -> None:
    payload = _unwrap_event_envelope(payload)

    user_id    = payload.get("userId")
    age        = payload.get("age")
    biometrics = payload.get("biometrics", [])
    sleeps     = payload.get("sleeps", [])

    if not biometrics:
        logger.warning("[ai.analyze] biometrics 없음 | userId=%s", user_id)
        return

    if sleeps:
        logger.info("[ai.analyze] PHQ 예측 + IF 재학습 시작 | userId=%s", user_id)
        result = phq.analyze_and_retrain(
            user_id    = user_id,
            age        = age,
            sleeps     = sleeps,
            biometrics = _normalize_biometrics(biometrics),
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
        logger.info("[ai.analyze] IF 재학습만 시작 | userId=%s", user_id)
        if_model.train_if_model(
            user_id       = user_id,
            biometrics    = _normalize_biometrics(biometrics),
            contamination = 0.01,
        )
        logger.info("[ai.analyze] IF 재학습 완료 | userId=%s", user_id)


<<<<<<< HEAD
# ──────────────────────────────────────────────
# Consumer 루프
# ──────────────────────────────────────────────
=======
def _handle_gps_check_request(payload: dict) -> None:
    payload = _unwrap_event_envelope(payload)

    children_id = payload.get("childrenId")
    parent_id   = payload.get("parentId")
    request_id  = payload.get("requestId")

    if not children_id:
        logger.warning("[gps-check.requested] childrenId missing | payload=%s", payload)
        return

    latitude  = payload.get("latitude")
    longitude = payload.get("longitude")
    if latitude is None or longitude is None:
        gps_check.save_pending_request(
            children_id=children_id,
            parent_id=parent_id,
            request_id=request_id,
        )
        return

    result = gps_check.evaluate_and_publish(
        children_id=children_id,
        parent_id=parent_id,
        latitude=float(latitude),
        longitude=float(longitude),
        request_id=request_id,
    )
    logger.info(
        "[gps-check.requested] evaluated inline | childrenId=%s matched=%s",
        children_id,
        result.matched,
    )
>>>>>>> develop


def _extract_status_card_payload(message: dict) -> tuple[dict, dict]:
    if "payload" in message and "eventType" in message:
        payload = message.get("payload") or {}
        if not isinstance(payload, dict):
            raise ValueError("Kafka envelope payload must be an object")
        return payload, message
    return message, {}


def _handle_status_card_requested(message: dict) -> None:
    payload, envelope = _extract_status_card_payload(message)

    user_id    = payload.get("userId")
    name       = payload.get("name")
    biometrics = payload.get("biometrics", [])
    sleeps     = payload.get("sleeps", [])

    if not user_id:
        logger.warning("[status-card.requested] userId missing | payload=%s", payload)
        return
    if not name:
        logger.warning("[status-card.requested] name missing | userId=%s", user_id)
        return
    if not biometrics or not sleeps:
        logger.warning(
            "[status-card.requested] data missing | userId=%s biometrics=%d sleeps=%d",
            user_id, len(biometrics), len(sleeps),
        )
        return

    result = status_card.generate_status_card(
        name=name,
        biometrics=biometrics,
        sleeps=sleeps,
    )
    publish_status_card_created(
        user_id=user_id,
        date=_today_seoul(),
        title=result["title"],
        description=result["description"],
        sub_title=result["subTitle"],
        suggestion=result["suggestion"],
        correlation_id=(envelope or {}).get("eventId"),
    )


# ──────────────────────────────────────────────
# Consumer 루프
# ──────────────────────────────────────────────

_stop_event = threading.Event()


def _consume_loop() -> None:
    """
    Kafka Consumer 메인 루프 (별도 스레드에서 실행)
    구독 토픽:
        - rebloom.biometric.received.v1
        - rebloom.model.training.requested.v1
        - rebloom.model.retraining.requested.v1
        - rebloom.gps-check.requested.v1
        - rebloom.status-card.requested.v1
    """
    consumer = Consumer({
        "bootstrap.servers"      : KAFKA_BOOTSTRAP_SERVERS,
        "group.id"               : KAFKA_GROUP_ID,
        "auto.offset.reset"      : "latest",
        "enable.auto.commit"     : True,
        "auto.commit.interval.ms": 5000,
    })

    topics = [
        KAFKA_TOPIC_BIOMETRIC_RAW,
        KAFKA_TOPIC_AI_TRAIN,
        KAFKA_TOPIC_AI_ANALYZE,
        KAFKA_TOPIC_STATUS_CARD_REQUESTED,
    ]
    consumer.subscribe(topics)
    logger.info("[Kafka] Consumer 구독 시작 | topics=%s", topics)

    handlers = {
<<<<<<< HEAD
        KAFKA_TOPIC_BIOMETRIC_RAW : _handle_biometric_raw,
        KAFKA_TOPIC_AI_TRAIN      : _handle_ai_train,
        KAFKA_TOPIC_AI_ANALYZE    : _handle_ai_analyze,
=======
        KAFKA_TOPIC_BIOMETRIC_RAW        : _handle_biometric_raw,
        KAFKA_TOPIC_AI_TRAIN             : _handle_ai_train,
        KAFKA_TOPIC_AI_ANALYZE           : _handle_ai_analyze,
        KAFKA_TOPIC_GPS_CHECK_REQUEST    : _handle_gps_check_request,
>>>>>>> develop
        KAFKA_TOPIC_STATUS_CARD_REQUESTED: _handle_status_card_requested,
    }

    try:
        while not _stop_event.is_set():
            msg = consumer.poll(timeout=1.0)

            if msg is None:
                continue

            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                raise KafkaException(msg.error())

            topic   = msg.topic()
            raw_val = msg.value()

            try:
                payload = json.loads(raw_val)
            except (json.JSONDecodeError, TypeError) as e:
                logger.error("[Kafka] JSON 파싱 실패 | topic=%s err=%s raw=%s", topic, e, raw_val)
                continue

            handler = handlers.get(topic)
            if handler is None:
                logger.warning("[Kafka] 핸들러 없음 | topic=%s", topic)
                continue

            try:
                handler(payload)
            except Exception as e:
                entity_payload = _unwrap_event_envelope(payload)
<<<<<<< HEAD
                entity_id = entity_payload.get("userId")
                logger.exception("[Kafka] 핸들러 예외 | topic=%s entityId=%s err=%s",
                                 topic, entity_id, e)
=======
                entity_id = (
                    entity_payload.get("childrenId")
                    if topic == KAFKA_TOPIC_GPS_CHECK_REQUEST
                    else entity_payload.get("userId")
                )
                logger.exception("[Kafka] 핸들러 예외 | topic=%s entityId=%s err=%s", topic, entity_id, e)
>>>>>>> develop

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
