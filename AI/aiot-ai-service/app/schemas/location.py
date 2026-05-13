"""
Location request/response schemas.

These models describe the payload sent by the mobile app after receiving
GPS coordinates from the watch.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class LocationEvaluateRequest(BaseModel):
    """Request body for evaluating the user's current GPS position."""

    user_id: str = Field(..., min_length=1, description="User id managed by auth-service")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Current GPS latitude")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Current GPS longitude")
    measured_at: datetime | None = Field(
        default=None,
        description="Timestamp when the GPS value was measured",
    )


class LocationEvaluateResponse(BaseModel):
    """Result of location evaluation and optional device trigger."""

    user_id: str
    device_id: str
    matched: bool
    distance_meters: float
    threshold_meters: float
    action: Literal["none", "rpi_signal_published"]
    request_id: str | None = None
    topic: str | None = None
