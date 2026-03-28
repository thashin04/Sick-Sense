"""
SickSense — Google Trends collector (pytrends).

Queries interest-over-time for health keywords scoped to Florida.
Uses interest_by_region with DMA resolution for metro-level data.
Falls back to mock data if pytrends fails (rate limits, etc.).
"""

import random
import time
from datetime import datetime, timezone

from backend.config.cities import get_city
from backend.config.schemas import TrendsDataPoint, GoogleTrendsReport
from backend.collectors.output_utils import save_collector_output


# Plain search terms — matches Google Trends website when "Search term" is selected
HEALTH_KEYWORDS = [
    {"term": "flu",                  "label": "flu"},
    {"term": "cold medicine",        "label": "cold medicine"},
    {"term": "urgent care near me",  "label": "urgent care near me"},
    {"term": "fever",                "label": "fever"},
    {"term": "cough",                "label": "cough"},
]


def _mock_trends(city: str) -> GoogleTrendsReport:
    """Generate mock Google Trends data."""
    random.seed(sum(ord(c) for c in city.lower()) + int(datetime.now().timestamp() / 86400))

    trends = []
    for kw in HEALTH_KEYWORDS:
        trends.append(TrendsDataPoint(
            keyword=kw["label"],
            interest=random.randint(10, 85),
        ))

    random.seed()

    return GoogleTrendsReport(
        city=city,
        timestamp=datetime.now(timezone.utc),
        trends=trends,
        source="mock",
    )


async def collect(city: str) -> GoogleTrendsReport:
    """Collect Google Trends data for health keywords in a city's metro area."""
    try:
        from pytrends.request import TrendReq

        city_cfg = get_city(city)
        pytrends = TrendReq(hl="en-US", tz=300)

        terms = [kw["term"] for kw in HEALTH_KEYWORDS]

        pytrends.build_payload(
            terms,
            cat=0,
            timeframe="now 7-d",
            geo=city_cfg.trends_geo,
        )

        df = pytrends.interest_over_time()

        if df.empty:
            report = _mock_trends(city)
            save_collector_output(city, "google_trends", report)
            return report

        trends = []
        for kw in HEALTH_KEYWORDS:
            col = kw["term"]
            if col in df.columns:
                avg_interest = int(df[col].mean())
                trends.append(TrendsDataPoint(keyword=kw["label"], interest=avg_interest))
            else:
                trends.append(TrendsDataPoint(keyword=kw["label"], interest=0))

        report = GoogleTrendsReport(
            city=city,
            timestamp=datetime.now(timezone.utc),
            trends=trends,
            source="pytrends",
        )

    except Exception as e:
        print(f"[google_trends] pytrends error for {city}: {e} — falling back to mock")
        report = _mock_trends(city)

    save_collector_output(city, "google_trends", report)
    return report
