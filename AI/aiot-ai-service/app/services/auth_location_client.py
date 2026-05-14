"""
Client for retrieving a user's target location from auth-service.

"""

import httpx

from app.core.config import settings


class AuthLocationClientError(Exception):
    """Raised when auth-service target location lookup fails."""


class AuthLocationUpstreamError(AuthLocationClientError):
    """Raised when auth-service cannot be reached or rejects the lookup."""


class AuthLocationInvalidResponseError(AuthLocationClientError):
    """Raised when auth-service returns an unusable target location response."""


def _coerce_coordinate_field(data: dict, field: str) -> float:
    value = data.get(field)
    if value is None:
        raise AuthLocationInvalidResponseError(
            f"auth-service response has null field: {field}"
        )

    try:
        return float(value)
    except (TypeError, ValueError) as exc:
        raise AuthLocationInvalidResponseError(
            f"auth-service response has invalid field: {field}"
        ) from exc


async def fetch_user_target_location(user_id: str) -> dict:
    """
    Fetch the target coordinate for a user from auth-service.

    Expected auth-service response:
        {
          "userId": "uuid-or-string",
          "latitude": 37.5012,
          "longitude": 127.0396,
          "deviceId": "rpi-001"
        }
    """
    url = (
        f"{settings.AUTH_SERVICE_BASE_URL.rstrip('/')}"
        f"{settings.AUTH_SERVICE_LOCATION_PATH.format(user_id=user_id)}"
    )

    try:
        async with httpx.AsyncClient(timeout=settings.AUTH_SERVICE_TIMEOUT) as client:
            response = await client.get(url)
            response.raise_for_status()
    except httpx.HTTPError as exc:
        raise AuthLocationUpstreamError(
            "Failed to fetch target location from auth-service"
        ) from exc

    try:
        body = response.json()
    except ValueError as exc:
        raise AuthLocationInvalidResponseError(
            "auth-service response body must be valid JSON"
        ) from exc

    if not isinstance(body, dict):
        raise AuthLocationInvalidResponseError(
            "auth-service response body must be an object"
        )

    data = body.get("data", body)
    if not isinstance(data, dict):
        raise AuthLocationInvalidResponseError(
            "auth-service response data must be an object"
        )

    required_fields = ("latitude", "longitude", "deviceId")
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        raise AuthLocationInvalidResponseError(
            f"auth-service response missing fields: {', '.join(missing_fields)}"
        )

    data["latitude"] = _coerce_coordinate_field(data, "latitude")
    data["longitude"] = _coerce_coordinate_field(data, "longitude")

    return data
