"""
SickSense — Hospital busyness collector (MOCK DATA).

Simulates Google Maps-style "popular times" busyness for hospitals
and urgent care centers. No official Google API exists for this data.
"""

import random
from datetime import datetime, timezone

from backend.config.cities import get_city
from backend.config.schemas import HospitalBusyness, HospitalReport
from backend.collectors.output_utils import save_collector_output


async def collect(city: str, outbreak_factor: float = 0.0) -> HospitalReport:
    """Collect mock hospital busyness data for a city.

    Args:
        city: City name/key
        outbreak_factor: 0.0 (normal) to 1.0 (severe outbreak)

    Returns:
        HospitalReport with per-hospital busyness scores.
    """
    city_cfg = get_city(city)

    seed_modifier = sum(ord(c) for c in city.lower())
    random.seed(int(datetime.now().timestamp() / 3600) + seed_modifier)

    hospitals = []
    for name in city_cfg.hospitals:
        typical = random.randint(35, 65)
        # During outbreak, busyness spikes
        spike = int(outbreak_factor * random.randint(15, 40))
        current = min(100, typical + random.randint(-10, 15) + spike)
        hospitals.append(HospitalBusyness(
            name=name,
            busyness_pct=current,
            typical_pct=typical,
            is_elevated=current > typical * 1.3,
        ))

    random.seed()

    report = HospitalReport(
        city=city,
        timestamp=datetime.now(timezone.utc),
        hospitals=hospitals,
        source="mock",
    )

    save_collector_output(city, "hospital_busyness", report)
    return report
