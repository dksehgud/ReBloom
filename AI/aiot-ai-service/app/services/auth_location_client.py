"""
Client for retrieving a user's target location from auth-service.

"""

import httpx

from app.core.config import settings


class AuthLocationClientError(Exception):
    """Raised when auth-service target location lookup fails."""


def _coerce_coordinate_field(data: dict, field: str) -> float:
    value = data.get(field)
    if value is None:
        raise AuthLocationClientError(f"auth-service response has null field: {field}")

    try:
        return float(value)
    except (TypeError, ValueError) as exc:
        raise AuthLocationClientError(
            f"auth-service response has invalid field: {field}"
        ) from exc


async def fetch_user_target_location(user_id: str) -> dict:
    """
    Fetch the target coordinate for a user from auth-service.

    Expected auth-service response:
        {
          "childId": "uuid-or-string",
          "latitude": 37.5012,
          "longitude": 127.0396
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
        raise AuthLocationClientError("Failed to fetch target location from auth-service") from exc

    body = response.json()
    data = body.get("data", body)
    if not isinstance(data, dict):
        raise AuthLocationClientError("auth-service response data must be an object")

    required_fields = ("latitude", "longitude")
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        raise AuthLocationClientError(
            f"auth-service response missing fields: {', '.join(missing_fields)}"
        )

    data["latitude"] = _coerce_coordinate_field(data, "latitude")
    data["longitude"] = _coerce_coordinate_field(data, "longitude")

    return data
