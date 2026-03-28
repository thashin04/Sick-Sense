"""
SickSense — 911 EMS dispatch collector (MOCK DATA).

Simulates emergency dispatch call volumes for health-related incidents.
Some Florida counties publish dispatch logs publicly — this mock
generates realistic data for the same format.
"""

import random
from datetime import datetime, timezone

from backend.config.schemas import EMSCall, EMSReport
from backend.collectors.output_utils import save_collector_output


# Typical EMS call categories that correlate with outbreaks
CALL_TYPES = [
    {"call_type": "respiratory_distress", "typical_daily": 12},
    {"call_type": "fever_chills", "typical_daily": 8},
    {"call_type": "nausea_vomiting", "typical_daily": 6},
    {"call_type": "chest_pain", "typical_daily": 15},
    {"call_type": "difficulty_breathing", "typical_daily": 10},
    {"call_type": "allergic_reaction", "typical_daily": 4},
    {"call_type": "pediatric_fever", "typical_daily": 5},
    {"call_type": "general_illness", "typical_daily": 18},
]


async def collect(city: str, outbreak_factor: float = 0.0) -> EMSReport:
    """Collect mock 911 EMS dispatch data for a city.

    Args:
        city: City name/key
        outbreak_factor: 0.0 (normal) to 1.0 (severe outbreak)

    Returns:
        EMSReport with call volumes by type.
    """
    seed_modifier = sum(ord(c) for c in city.lower())
    random.seed(int(datetime.now().timestamp() / 3600) + seed_modifier)

    calls = []
    total_health = 0

    for ct in CALL_TYPES:
        typical = ct["typical_daily"]
        # Normal variation + outbreak spike for respiratory/fever types
        is_outbreak_type = ct["call_type"] in {
            "respiratory_distress", "fever_chills", "difficulty_breathing",
            "pediatric_fever", "general_illness",
        }
        spike = int(outbreak_factor * random.randint(5, 15)) if is_outbreak_type else 0
        count = max(0, typical + random.randint(-3, 5) + spike)

        calls.append(EMSCall(
            call_type=ct["call_type"],
            count=count,
            typical_count=typical,
        ))
        total_health += count

    random.seed()

    report = EMSReport(
        city=city,
        timestamp=datetime.now(timezone.utc),
        calls=calls,
        total_health_calls=total_health,
        source="mock",
    )

    save_collector_output(city, "ems_dispatch", report)
    return report
