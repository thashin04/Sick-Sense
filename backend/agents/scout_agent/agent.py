"""
SickSense — Scout Agent.

The Scout is the data-collection workhorse. It calls all 7 data collectors
for a given city and aggregates the results into a unified CityDataSnapshot.
Exposed as an A2A server on port 8001.
"""

import asyncio
import json
from datetime import datetime, timezone

from google.adk.agents import Agent

from backend.collectors import (
    pharmacy,
    pollen,
    air_quality,
    hospital_busyness,
    social_media,
    google_trends,
    ems_dispatch,
)
from backend.config.schemas import CityDataSnapshot


async def collect_pharmacy_data(city: str) -> dict:
    """Collect pharmacy OTC medication stock levels for a city.

    Args:
        city: Name of the Florida city to scan (e.g. "Orlando", "Tampa").

    Returns:
        dict with pharmacy stock data including medication names,
        current vs typical stock levels, and percent remaining.
    """
    report = await pharmacy.collect(city)
    return report.model_dump(mode="json")


async def collect_pollen_data(city: str) -> dict:
    """Collect pollen levels and allergen data for a city.

    Args:
        city: Name of the Florida city to scan.

    Returns:
        dict with pollen indices (grass, tree, weed), overall risk level,
        and health recommendations.
    """
    report = await pollen.collect(city)
    return report.model_dump(mode="json")


async def collect_air_quality_data(city: str) -> dict:
    """Collect air quality index and pollutant data for a city.

    Args:
        city: Name of the Florida city to scan.

    Returns:
        dict with AQI score, dominant pollutant, category,
        and health recommendations.
    """
    report = await air_quality.collect(city)
    return report.model_dump(mode="json")


async def collect_hospital_busyness_data(city: str) -> dict:
    """Collect hospital and urgent care busyness levels for a city.

    Args:
        city: Name of the Florida city to scan.

    Returns:
        dict with per-hospital busyness percentages and whether
        they are elevated compared to typical levels.
    """
    report = await hospital_busyness.collect(city)
    return report.model_dump(mode="json")


async def collect_social_media_data(city: str) -> dict:
    """Collect social media posts mentioning sickness in a city.

    Args:
        city: Name of the Florida city to scan.

    Returns:
        dict with Reddit posts about sickness, keyword frequency counts,
        and total sickness mentions.
    """
    report = await social_media.collect(city)
    return report.model_dump(mode="json")


async def collect_google_trends_data(city: str) -> dict:
    """Collect Google search trends for health-related keywords in a city.

    Args:
        city: Name of the Florida city to scan.

    Returns:
        dict with keyword interest scores (0-100) for health-related
        search terms like 'flu symptoms', 'cold medicine', etc.
    """
    report = await google_trends.collect(city)
    return report.model_dump(mode="json")


async def collect_ems_dispatch_data(city: str) -> dict:
    """Collect 911 EMS dispatch call volumes for health incidents in a city.

    Args:
        city: Name of the Florida city to scan.

    Returns:
        dict with call counts by type (respiratory, fever, etc.)
        compared to typical daily volumes.
    """
    report = await ems_dispatch.collect(city)
    return report.model_dump(mode="json")


root_agent = Agent(
    name="scout_agent",
    model="gemini-3-flash-preview",
    description=(
        "Data collection scout for SickSense. Gathers health-related data "
        "from 7 sources (pharmacy stocks, pollen, air quality, hospital busyness, "
        "social media, Google Trends, and EMS dispatch) for Florida cities."
    ),
    instruction=(
        "You are the Scout Agent for SickSense, a health outbreak detection system. "
        "When given a city name, you MUST call ALL 7 data collection tools to gather "
        "comprehensive health data for that city. Call them all and compile the results "
        "into a thorough report. Do not skip any data source. "
        "Present the data clearly organized by source. "
        "The cities you support are: Tallahassee, Gainesville, Jacksonville, "
        "Tampa, Orlando, Miami, and Fort Lauderdale (all in Florida). "
        "If a data source fails, note the failure but continue with the rest."
    ),
    tools=[
        collect_pharmacy_data,
        collect_pollen_data,
        collect_air_quality_data,
        collect_hospital_busyness_data,
        collect_social_media_data,
        collect_google_trends_data,
        collect_ems_dispatch_data,
    ],
)
