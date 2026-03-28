"""
SickSense — Pharmacy stock collector (MOCK DATA).

Simulates OTC medication stock levels for pharmacies in Florida cities.
Generates realistic fluctuations — low stock = potential demand spike.
"""

import random
from datetime import datetime, timezone

from backend.config.schemas import MedicationStock, PharmacyReport
from backend.collectors.output_utils import save_collector_output

# Typical OTC medications people buy when sick
OTC_MEDICATIONS = [
    {"name": "DayQuil", "typical_stock": 120},
    {"name": "NyQuil", "typical_stock": 100},
    {"name": "Tylenol Cold & Flu", "typical_stock": 90},
    {"name": "Mucinex", "typical_stock": 80},
    {"name": "Robitussin", "typical_stock": 70},
    {"name": "Advil Cold & Sinus", "typical_stock": 60},
    {"name": "Theraflu", "typical_stock": 55},
    {"name": "Zicam", "typical_stock": 50},
    {"name": "Emergen-C", "typical_stock": 150},
    {"name": "Halls Cough Drops", "typical_stock": 200},
    {"name": "Vicks VapoRub", "typical_stock": 65},
    {"name": "Children's Tylenol", "typical_stock": 45},
]


def _simulate_stock(typical: int, outbreak_factor: float = 0.0) -> int:
    """Simulate current stock with random noise + optional outbreak drain."""
    # Normal variation: 70-100% of typical
    base_pct = random.uniform(0.70, 1.0)
    # Outbreak factor (0-1) reduces stock further
    outbreak_drain = outbreak_factor * random.uniform(0.3, 0.7)
    final_pct = max(0.05, base_pct - outbreak_drain)
    return max(1, int(typical * final_pct))


async def collect(city: str, outbreak_factor: float = 0.0) -> PharmacyReport:
    """Collect mock pharmacy stock data for a city.

    Args:
        city: City name/key
        outbreak_factor: 0.0 (normal) to 1.0 (severe outbreak) — controls
            how depleted stocks appear. Default 0.0 uses purely random data.

    Returns:
        PharmacyReport with medication stock levels.
    """
    # Use city name as seed modifier for consistent-ish results per city
    seed_modifier = sum(ord(c) for c in city.lower())
    random.seed(int(datetime.now().timestamp() / 3600) + seed_modifier)

    medications = []
    for med in OTC_MEDICATIONS:
        current = _simulate_stock(med["typical_stock"], outbreak_factor)
        medications.append(MedicationStock(
            name=med["name"],
            typical_stock=med["typical_stock"],
            current_stock=current,
            pct_remaining=round(current / med["typical_stock"], 3),
        ))

    # Reset random seed
    random.seed()

    report = PharmacyReport(
        city=city,
        timestamp=datetime.now(timezone.utc),
        medications=medications,
        source="mock",
    )

    save_collector_output(city, "pharmacy", report)
    return report
