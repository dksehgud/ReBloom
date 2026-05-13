"""
Location based trigger router.

This router receives the user's current GPS coordinate, fetches the user's
target coordinate from auth-service, compares both positions, and publishes
a Raspberry Pi signal when the user is inside the target radius.
"""

import logging

from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool

from app.core.config import settings
from app.schemas.location import LocationEvaluateRequest, LocationEvaluateResponse
from app.services.auth_location_client import (
    AuthLocationClientError,
    AuthLocationInvalidResponseError,
    fetch_user_target_location,
)
from app.services.location_judgement import Coordinate, is_within_target_location
from app.services.rpi_location_signal_client import (
    RPILocationSignalPublishError,
    publish_location_signal,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/location", tags=["location"])


@router.post("/evaluate", response_model=LocationEvaluateResponse)
async def evaluate_location(
    request: LocationEvaluateRequest,
) -> LocationEvaluateResponse:
    """Evaluate current GPS and publish a Raspberry Pi signal on target match."""
    logger.info(
        "[location] evaluate requested | user_id=%s lat=%s lon=%s",
        request.user_id,
        request.latitude,
        request.longitude,
    )

    try:
        target = await fetch_user_target_location(request.user_id)
    except AuthLocationInvalidResponseError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except AuthLocationClientError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    current_coordinate = Coordinate(
        latitude=request.latitude,
        longitude=request.longitude,
    )
    target_coordinate = Coordinate(
        latitude=float(target["latitude"]),
        longitude=float(target["longitude"]),
    )
    threshold_meters = settings.LOCATION_RADIUS_METERS
    device_id = settings.LOCATION_DEVICE_ID

    result = is_within_target_location(
        current=current_coordinate,
        target=target_coordinate,
        threshold_meters=threshold_meters,
    )

    if not result.matched:
        return LocationEvaluateResponse(
            user_id=request.user_id,
            device_id=device_id,
            matched=False,
            distance_meters=result.distance_meters,
            threshold_meters=result.threshold_meters,
            action="none",
        )

    try:
        topic, request_id, _payload = await run_in_threadpool(
            publish_location_signal,
            device_id,
            request.user_id,
            result.distance_meters,
            result.threshold_meters,
        )
    except RPILocationSignalPublishError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return LocationEvaluateResponse(
        user_id=request.user_id,
        device_id=device_id,
        matched=True,
        distance_meters=result.distance_meters,
        threshold_meters=result.threshold_meters,
        action="rpi_signal_published",
        request_id=request_id,
        topic=topic,
    )
