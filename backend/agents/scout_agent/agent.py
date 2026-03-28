"""
SickSense — Scout Agent.

The Scout is the data-collection workhorse. It calls all 8 data collectors
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
    cdc_outbreaks,
)
from backend.config.schemas import CityDataSnapshot
from backend.db.firebase import save_health_data


async def collect_pharmacy_data(city: str) -> dict:
    """Collect pharmacy OTC medication stock levels for a city.

    Args:
        city: Name of the Florida city to scan (e.g. "Orlando", "Tampa").

    Returns:
        dict with pharmacy stock data including medication names,
        current vs typical stock levels, and percent remaining.
    """
    report = await pharmacy.collect(city)
    data = report.model_dump(mode="json")
    save_health_data(city, "pharmacy", data)
    return data


async def collect_pollen_data(city: str) -> dict:
    """Collect pollen levels and allergen data for a city.

    Args:
        city: Name of the Florida city to scan.

    Returns:
        dict with pollen indices (grass, tree, weed), overall risk level,
        and health recommendations.
    """
    report = await pollen.collect(city)
    data = report.model_dump(mode="json")
    save_health_data(city, "pollen", data)
    return data


async def collect_air_quality_data(city: str) -> dict:
    """Collect air quality index and pollutant data for a city.

    Args:
        city: Name of the Florida city to scan.

    Returns:
        dict with AQI score, dominant pollutant, category,
        and health recommendations.
    """
    report = await air_quality.collect(city)
    data = report.model_dump(mode="json")
    save_health_data(city, "air_quality", data)
    return data


async def collect_hospital_busyness_data(city: str) -> dict:
    """Collect hospital and urgent care busyness levels for a city.

    Args:
        city: Name of the Florida city to scan.

    Returns:
        dict with per-hospital busyness percentages and whether
        they are elevated compared to typical levels.
    """
    report = await hospital_busyness.collect(city)
    data = report.model_dump(mode="json")
    save_health_data(city, "hospital_busyness", data)
    return data


async def collect_social_media_data(city: str) -> dict:
    """Collect social media posts mentioning sickness in a city.

    Args:
        city: Name of the Florida city to scan.

    Returns:
        dict with Reddit posts about sickness, keyword frequency counts,
        and total sickness mentions.
    """
    report = await social_media.collect(city)
    data = report.model_dump(mode="json")
    save_health_data(city, "social_media", data)
    return data


async def collect_google_trends_data(city: str) -> dict:
    """Collect Google search trends for health-related keywords in a city.

    Args:
        city: Name of the Florida city to scan.

    Returns:
        dict with keyword interest scores (0-100) for health-related
        search terms like 'flu symptoms', 'cold medicine', etc.
    """
    report = await google_trends.collect(city)
    data = report.model_dump(mode="json")
    save_health_data(city, "google_trends", data)
    return data


async def collect_ems_dispatch_data(city: str) -> dict:
    """Collect 911 EMS dispatch call volumes for health incidents in a city.

    Args:
        city: Name of the Florida city to scan.

    Returns:
        dict with call counts by type (respiratory, fever, etc.)
        compared to typical daily volumes.
    """
    report = await ems_dispatch.collect(city)
    data = report.model_dump(mode="json")
    save_health_data(city, "ems_dispatch", data)
    return data


async def collect_cdc_outbreaks_data(city: str) -> dict:
    """Collect current sickness outbreaks globally and nationally via CDC.

    Args:
        city: Name of the Florida city to scan.

    Returns:
        dict with list of active outbreaks including pathogen and status.
    """
    report = await cdc_outbreaks.collect(city)
    data = report.model_dump(mode="json")
    save_health_data(city, "cdc_outbreaks", data)
    return data


root_agent = Agent(
    name="scout_agent",
    model="gemini-3-flash-preview",
    description=(
        "Data collection scout for SickSense. Gathers health-related data "
        "from 8 sources (pharmacy stocks, pollen, air quality, hospital busyness, "
        "social media, Google Trends, EMS dispatch, and CDC Outbreaks) for Florida cities."
    ),
    instruction=(
        "You are the Scout Agent for SickSense, a health outbreak detection system. "
        "When given a city name, you MUST call ALL 8 data collection tools to gather "
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
        collect_cdc_outbreaks_data,
    ],
)
