import json
import logging
import math
from dataclasses import dataclass
from urllib import error, request

import redis

from app.config.settings import (
    AUTH_SERVICE_LOCATION_PATH,
    AUTH_SERVICE_URL,
    GPS_CHECK_PENDING_TTL_SECONDS,
    GPS_CHECK_RADIUS_METERS,
    REDIS_HOST,
    REDIS_PORT,
)
from app.kafka.producer import publish_gps_check_result

logger = logging.getLogger(__name__)

_redis: redis.Redis | None = None


@dataclass
class GpsCheckResult:
    children_id: str
    parent_id: str | None
    device_id: str | None
    matched: bool
    distance_meters: float
    threshold_meters: float
    target_name: str | None
    action: str
    request_id: str | None
    topic: str


def get_redis() -> redis.Redis:
    global _redis
    if _redis is None:
        _redis = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    return _redis


def save_pending_request(
    children_id: str,
    parent_id: str | None,
    request_id: str | None,
) -> None:
    payload = {
        "childrenId": children_id,
        "parentId": parent_id,
        "requestId": request_id,
    }
    get_redis().setex(
        _pending_key(children_id),
        GPS_CHECK_PENDING_TTL_SECONDS,
        json.dumps(payload),
    )
    logger.info("[gps-check] pending request saved | childrenId=%s requestId=%s", children_id, request_id)


def pop_pending_request(children_id: str) -> dict | None:
    key = _pending_key(children_id)
    raw = get_redis().get(key)
    if not raw:
        return None
    get_redis().delete(key)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        logger.warning("[gps-check] invalid pending payload | childrenId=%s raw=%s", children_id, raw)
        return None


def evaluate_and_publish(
    children_id: str,
    parent_id: str | None,
    latitude: float,
    longitude: float,
    request_id: str | None = None,
) -> GpsCheckResult:
    target = fetch_target_location(children_id)
    distance_meters = haversine_meters(
        latitude,
        longitude,
        float(target["latitude"]),
        float(target["longitude"]),
    )
    threshold_meters = GPS_CHECK_RADIUS_METERS
    matched = distance_meters <= threshold_meters
    topic = publish_gps_check_result(
        children_id=children_id,
        parent_id=parent_id,
        matched=matched,
        distance_meters=distance_meters,
        threshold_meters=threshold_meters,
        request_id=request_id,
    )
    return GpsCheckResult(
        children_id=children_id,
        parent_id=parent_id,
        device_id=target.get("deviceId"),
        matched=matched,
        distance_meters=distance_meters,
        threshold_meters=threshold_meters,
        target_name=target.get("targetName"),
        action="same" if matched else "different",
        request_id=request_id,
        topic=topic,
    )


def fetch_target_location(children_id: str) -> dict:
    path = AUTH_SERVICE_LOCATION_PATH.format(children_id=children_id)
    url = f"{AUTH_SERVICE_URL.rstrip('/')}{path}"

    try:
        with request.urlopen(url, timeout=5) as response:
            body = json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        raise RuntimeError(f"auth-service target location request failed: {exc.code}") from exc
    except error.URLError as exc:
        raise RuntimeError(f"auth-service target location unavailable: {exc.reason}") from exc

    data = body.get("data") if isinstance(body, dict) else None
    if not isinstance(data, dict):
        raise RuntimeError("auth-service target location response has no data")
    if data.get("latitude") is None or data.get("longitude") is None:
        raise RuntimeError("auth-service target location response is missing coordinates")
    return data


def haversine_meters(
    latitude: float,
    longitude: float,
    target_latitude: float,
    target_longitude: float,
) -> float:
    radius_meters = 6_371_000
    lat1 = math.radians(latitude)
    lat2 = math.radians(target_latitude)
    delta_lat = math.radians(target_latitude - latitude)
    delta_lon = math.radians(target_longitude - longitude)

    a = math.sin(delta_lat / 2) ** 2 + (
        math.cos(lat1) * math.cos(lat2) * math.sin(delta_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius_meters * c


def _pending_key(children_id: str) -> str:
    return f"gps_check:pending:{children_id}"
