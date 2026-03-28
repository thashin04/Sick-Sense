"""
SickSense data collectors — one module per data source.
"""

from backend.collectors import (
    pharmacy,
    pollen,
    air_quality,
    hospital_busyness,
    social_media,
    google_trends,
    ems_dispatch,
)

__all__ = [
    "pharmacy",
    "pollen",
    "air_quality",
    "hospital_busyness",
    "social_media",
    "google_trends",
    "ems_dispatch",
]
