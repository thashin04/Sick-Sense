"""
SickSense — Pollen collector (Google Pollen API).

Calls the Google Pollen API to get pollen forecast data for a city.
Falls back to mock data if no API key or if the API request fails.
"""

import os
from datetime import datetime, timezone

import httpx

from backend.config.cities import get_city
from backend.config.schemas import PollenReport
from backend.collectors.output_utils import save_collector_output


POLLEN_API_URL = "https://pollen.googleapis.com/v1/forecast:lookup"


def _mock_pollen(city: str) -> PollenReport:
    """Generate mock pollen data as fallback."""
    import random
    random.seed(sum(ord(c) for c in city.lower()) + int(datetime.now().timestamp() / 86400))

    grass = random.randint(0, 4)
    tree = random.randint(0, 5)
    weed = random.randint(0, 3)
    overall = max(grass, tree, weed)
    risk_map = {0: "None", 1: "Low", 2: "Low", 3: "Medium", 4: "High", 5: "Very High"}

    random.seed()
    return PollenReport(
        city=city,
        timestamp=datetime.now(timezone.utc),
        grass_index=grass,
        tree_index=tree,
        weed_index=weed,
        overall_risk=risk_map.get(overall, "Medium"),
        health_recommendations=[
            "Check local pollen forecasts before outdoor activities.",
            "Keep windows closed during peak pollen hours.",
        ],
        source="mock",
    )


async def collect(city: str) -> PollenReport:
    """Collect pollen data for a city.

    Uses Google Pollen API if GOOGLE_API_KEY is set, otherwise mock data.
    """
    api_key = os.getenv("GOOGLE_MAPS_API_KEY", os.getenv("GOOGLE_API_KEY", ""))
    if not api_key or api_key == "your-google-api-key-here":
        report = _mock_pollen(city)
        save_collector_output(city, "pollen", report)
        return report

    city_cfg = get_city(city)

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                POLLEN_API_URL,
                params={
                    "key": api_key,
                    "location.latitude": city_cfg.lat,
                    "location.longitude": city_cfg.lng,
                    "days": 1,
                    "languageCode": "en",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        # Parse first day's forecast
        day = data.get("dailyInfo", [{}])[0]
        pollen_types = {p.get("code", ""): p for p in day.get("pollenTypeInfo", [])}

        def _index(code: str) -> int:
            info = pollen_types.get(code, {})
            return info.get("indexInfo", {}).get("value", 0)

        grass = _index("GRASS")
        tree = _index("TREE")
        weed = _index("WEED")
        overall = max(grass, tree, weed)
        risk_map = {0: "None", 1: "Low", 2: "Low", 3: "Medium", 4: "High", 5: "Very High"}

        recommendations = []
        for pt in day.get("pollenTypeInfo", []):
            recs = pt.get("healthRecommendations", [])
            recommendations.extend(recs)

        report = PollenReport(
            city=city,
            timestamp=datetime.now(timezone.utc),
            grass_index=grass,
            tree_index=tree,
            weed_index=weed,
            overall_risk=risk_map.get(overall, "Medium"),
            health_recommendations=recommendations[:5],
            source="google_pollen_api",
        )

    except Exception as e:
        print(f"[pollen] API error for {city}: {e} — falling back to mock")
        report = _mock_pollen(city)

    save_collector_output(city, "pollen", report)
    return report
