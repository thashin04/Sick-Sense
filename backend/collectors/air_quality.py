"""
SickSense — Air quality collector (Google Air Quality API).

Calls the Google Air Quality API for current conditions.
Falls back to mock data if no API key or on failure.
"""

import os
from datetime import datetime, timezone

import httpx

from backend.config.cities import get_city
from backend.config.schemas import AirQualityReport
from backend.collectors.output_utils import save_collector_output


AQ_API_URL = "https://airquality.googleapis.com/v1/currentConditions:lookup"


def _mock_air_quality(city: str) -> AirQualityReport:
    """Generate mock air quality data as fallback."""
    import random
    random.seed(sum(ord(c) for c in city.lower()) + int(datetime.now().timestamp() / 86400))

    aqi = random.randint(20, 120)
    if aqi <= 50:
        category, pollutant = "Good", "PM2.5"
    elif aqi <= 100:
        category, pollutant = "Moderate", "O3"
    else:
        category, pollutant = "Unhealthy for Sensitive Groups", "PM2.5"

    random.seed()
    return AirQualityReport(
        city=city,
        timestamp=datetime.now(timezone.utc),
        aqi=aqi,
        dominant_pollutant=pollutant,
        category=category,
        health_recommendations=[
            "Sensitive individuals should limit prolonged outdoor exertion." if aqi > 50
            else "Air quality is good — enjoy outdoor activities."
        ],
        source="mock",
    )


async def collect(city: str) -> AirQualityReport:
    """Collect air quality data for a city."""
    api_key = os.getenv("GOOGLE_MAPS_API_KEY", os.getenv("GOOGLE_API_KEY", ""))
    if not api_key or api_key == "your-google-api-key-here":
        report = _mock_air_quality(city)
        save_collector_output(city, "air_quality", report)
        return report

    city_cfg = get_city(city)

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{AQ_API_URL}?key={api_key}",
                json={
                    "location": {
                        "latitude": city_cfg.lat,
                        "longitude": city_cfg.lng,
                    },
                    "languageCode": "en",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        # Parse the first index (US AQI preferred)
        indexes = data.get("indexes", [])
        us_aqi = next((i for i in indexes if i.get("code") == "uaqi"), indexes[0] if indexes else {})

        aqi = us_aqi.get("aqi", 0)
        category = us_aqi.get("category", "")
        pollutant = us_aqi.get("dominantPollutant", "")

        recs = []
        for idx in indexes:
            rec = idx.get("healthRecommendations", {})
            if isinstance(rec, dict):
                recs.extend(rec.values())
            elif isinstance(rec, list):
                recs.extend(rec)

        report = AirQualityReport(
            city=city,
            timestamp=datetime.now(timezone.utc),
            aqi=aqi,
            dominant_pollutant=pollutant,
            category=category,
            health_recommendations=recs[:5],
            source="google_air_quality_api",
        )

    except Exception as e:
        print(f"[air_quality] API error for {city}: {e} — falling back to mock")
        report = _mock_air_quality(city)

    save_collector_output(city, "air_quality", report)
    return report
