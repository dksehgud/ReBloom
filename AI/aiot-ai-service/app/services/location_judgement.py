"""
Location judgement helpers.

The core rule is intentionally small: compare the user's current GPS position
with the target latitude/longitude returned by auth-service.
"""

from dataclasses import dataclass
from math import atan2, cos, radians, sin, sqrt


EARTH_RADIUS_METERS = 6_371_000


@dataclass(frozen=True)
class Coordinate:
    """A latitude/longitude pair."""

    latitude: float
    longitude: float


@dataclass(frozen=True)
class LocationMatch:
    """Distance comparison result."""

    matched: bool
    distance_meters: float
    threshold_meters: float


def calculate_distance_meters(current: Coordinate, target: Coordinate) -> float:
    """Calculate the distance between two coordinates using the haversine formula."""
    current_lat = radians(current.latitude)
    current_lon = radians(current.longitude)
    target_lat = radians(target.latitude)
    target_lon = radians(target.longitude)

    delta_lat = target_lat - current_lat
    delta_lon = target_lon - current_lon

    a = (
        sin(delta_lat / 2) ** 2
        + cos(current_lat) * cos(target_lat) * sin(delta_lon / 2) ** 2
    )
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return EARTH_RADIUS_METERS * c


def is_within_target_location(
    current: Coordinate,
    target: Coordinate,
    threshold_meters: float,
) -> LocationMatch:
    """Return whether current coordinate is inside the target radius."""
    distance_meters = calculate_distance_meters(current=current, target=target)

    return LocationMatch(
        matched=distance_meters <= threshold_meters,
        distance_meters=round(distance_meters, 2),
        threshold_meters=threshold_meters,
    )

