"""
SickSense — Scout Agent (ParallelAgent).

The Scout is the data-collection workhorse.  It uses a ParallelAgent to invoke
8 specialist sub-agents concurrently — one per data source — for a given
Florida city, then aggregates their results into a unified report.
Exposed as an A2A server on port 8001.
"""

import asyncio
import json
from datetime import datetime, timezone

from google.adk.agents import Agent, ParallelAgent, SequentialAgent

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
from backend.db.firebase import save_health_data, get_recent_self_reports


# ── Tool functions (unchanged) ───────────────────────────────────────────────

async def collect_pharmacy_data(city: str) -> dict:
    """Collect pharmacy OTC medication stock levels for a city.

    Args:
        city: Name of the Florida city to scan (e.g. "Orlando", "Tampa").

    Returns:
        dict with pharmacy stock data including medication names,
        current vs typical stock levels, and percent remaining.
    """
    try:
        report = await pharmacy.collect(city)
        return report.model_dump(mode="json")
    except Exception as e:
        return {"error": f"Failed to collect pharmacy data for {city}: {str(e)}"}


async def collect_pollen_data(city: str) -> dict:
    """Collect pollen levels and allergen data for a city.

    Args:
        city: Name of the Florida city to scan.

    Returns:
        dict with pollen indices (grass, tree, weed), overall risk level,
        and health recommendations.
    """
    try:
        report = await pollen.collect(city)
        return report.model_dump(mode="json")
    except Exception as e:
        return {"error": f"Failed to collect pollen data for {city}: {str(e)}"}


async def collect_air_quality_data(city: str) -> dict:
    """Collect air quality index and pollutant data for a city.

    Args:
        city: Name of the Florida city to scan.

    Returns:
        dict with AQI score, dominant pollutant, category,
        and health recommendations.
    """
    try:
        report = await air_quality.collect(city)
        return report.model_dump(mode="json")
    except Exception as e:
        return {"error": f"Failed to collect air quality data for {city}: {str(e)}"}


async def collect_hospital_busyness_data(city: str) -> dict:
    """Collect hospital and urgent care busyness levels for a city.

    Args:
        city: Name of the Florida city to scan.

    Returns:
        dict with per-hospital busyness percentages and whether
        they are elevated compared to typical levels.
    """
    try:
        report = await hospital_busyness.collect(city)
        return report.model_dump(mode="json")
    except Exception as e:
        return {"error": f"Failed to collect hospital busyness data for {city}: {str(e)}"}


async def collect_social_media_data(city: str) -> dict:
    """Collect social media posts mentioning sickness in a city.

    Args:
        city: Name of the Florida city to scan.

    Returns:
        dict with Reddit posts about sickness, keyword frequency counts,
        and total sickness mentions.
    """
    try:
        report = await social_media.collect(city)
        return report.model_dump(mode="json")
    except Exception as e:
        return {"error": f"Failed to collect social media data for {city}: {str(e)}"}


async def collect_google_trends_data(city: str) -> dict:
    """Collect Google search trends for health-related keywords in a city.

    Args:
        city: Name of the Florida city to scan.

    Returns:
        dict with keyword interest scores (0-100) for health-related
        search terms like 'flu symptoms', 'cold medicine', etc.
    """
    try:
        report = await google_trends.collect(city)
        return report.model_dump(mode="json")
    except Exception as e:
        return {"error": f"Failed to collect Google Trends data for {city}: {str(e)}"}


async def collect_ems_dispatch_data(city: str) -> dict:
    """Collect 911 EMS dispatch call volumes for health incidents in a city.

    Args:
        city: Name of the Florida city to scan.

    Returns:
        dict with call counts by type (respiratory, fever, etc.)
        compared to typical daily volumes.
    """
    try:
        report = await ems_dispatch.collect(city)
        return report.model_dump(mode="json")
    except Exception as e:
        return {"error": f"Failed to collect EMS dispatch data for {city}: {str(e)}"}


async def collect_cdc_outbreaks_data(city: str) -> dict:
    """Collect current sickness outbreaks globally and nationally via CDC.

    Args:
        city: Name of the Florida city to scan.

    Returns:
        dict with list of active outbreaks including pathogen and status.
    """
    try:
        report = await cdc_outbreaks.collect(city)
        return report.model_dump(mode="json")
    except Exception as e:
        return {"error": f"Failed to collect CDC outbreak data for {city}: {str(e)}"}


async def collect_self_report_data(city: str) -> dict:
    """Collect recent user crowdsourced health self-reports for a city.

    Args:
        city: Name of the Florida city to scan.

    Returns:
        dict with list of user-submitted health reports from the last 7 days.
    """
    try:
        from backend.config.cities import get_city
        city_cfg = get_city(city)
        reports = get_recent_self_reports(city_cfg.name, days=7)
        return {"self_reports": reports, "count": len(reports)}
    except Exception as e:
        return {"error": f"Failed to collect self-report data for {city}: {str(e)}"}


# ── Specialist sub-agents (one tool each) ────────────────────────────────────

_SUB_AGENT_INSTRUCTION = (
    "You are a specialist data-collection agent for SickSense. "
    "When given a city name, call your data-collection tool for that city "
    "and return the raw results. If the tool errors, return a clear error "
    "message noting which source failed. "
    "Supported cities: Tallahassee, Gainesville, Jacksonville, Tampa, "
    "Orlando, Miami, Fort Lauderdale (all in Florida)."
)

pharmacy_agent = Agent(
    name="pharmacy_scout",
    model="gemini-3-flash-preview",
    description="Collects pharmacy OTC medication stock levels for a city.",
    instruction=_SUB_AGENT_INSTRUCTION,
    tools=[collect_pharmacy_data],
)

pollen_agent = Agent(
    name="pollen_scout",
    model="gemini-3-flash-preview",
    description="Collects pollen levels and allergen data for a city.",
    instruction=_SUB_AGENT_INSTRUCTION,
    tools=[collect_pollen_data],
)

air_quality_agent = Agent(
    name="air_quality_scout",
    model="gemini-3-flash-preview",
    description="Collects air quality index and pollutant data for a city.",
    instruction=_SUB_AGENT_INSTRUCTION,
    tools=[collect_air_quality_data],
)

hospital_agent = Agent(
    name="hospital_scout",
    model="gemini-3-flash-preview",
    description="Collects hospital and urgent care busyness levels for a city.",
    instruction=_SUB_AGENT_INSTRUCTION,
    tools=[collect_hospital_busyness_data],
)

social_media_agent = Agent(
    name="social_media_scout",
    model="gemini-3-flash-preview",
    description="Collects social media sickness mentions for a city.",
    instruction=_SUB_AGENT_INSTRUCTION,
    tools=[collect_social_media_data],
)

google_trends_agent = Agent(
    name="google_trends_scout",
    model="gemini-3-flash-preview",
    description="Collects Google Trends health-keyword interest for a city.",
    instruction=_SUB_AGENT_INSTRUCTION,
    tools=[collect_google_trends_data],
)

ems_dispatch_agent = Agent(
    name="ems_dispatch_scout",
    model="gemini-3-flash-preview",
    description="Collects 911 EMS dispatch call volumes for a city.",
    instruction=_SUB_AGENT_INSTRUCTION,
    tools=[collect_ems_dispatch_data],
)

cdc_outbreaks_agent = Agent(
    name="cdc_outbreaks_scout",
    model="gemini-3-flash-preview",
    description="Collects CDC active outbreak data relevant to a city.",
    instruction=_SUB_AGENT_INSTRUCTION,
    tools=[collect_cdc_outbreaks_data],
)

self_report_agent = Agent(
    name="self_report_scout",
    model="gemini-3-flash-preview",
    description="Collects recent user-submitted health reports and symptoms for a city.",
    instruction=_SUB_AGENT_INSTRUCTION,
    tools=[collect_self_report_data],
)

# ── ParallelAgent (concurrent data collection) ──────────────────────────────

_parallel_collector = ParallelAgent(
    name="parallel_collector",
    description=(
        "Runs all 9 specialist scouts simultaneously to collect health data."
    ),
    sub_agents=[
        pharmacy_agent,
        pollen_agent,
        air_quality_agent,
        hospital_agent,
        social_media_agent,
        google_trends_agent,
        ems_dispatch_agent,
        cdc_outbreaks_agent,
        self_report_agent,
    ],
)

# ── Aggregator Agent (synthesises parallel outputs) ──────────────────────────

_aggregator = Agent(
    name="scout_aggregator",
    model="gemini-3-flash-preview",
    description=(
        "Aggregates the parallel data collection results into a single, "
        "comprehensive city health data report. Pay special attention to "
        "any user-selected medications or insurance mentions in the prompt."
    ),
    instruction=(
        "You have just received the outputs from 9 parallel data-collection scouts. "
        "Your job is to compile ALL of their data into one thorough, well-organized "
        "health data report for the city.\n\n"
        "If the user has specified preferred medicines or an insurance provider in their request, "
        "be sure to highlight findings (like stock levels or coverage alerts) specifically for those items.\n\n"
        "Structure your report with these sections:\n"
        "1. **Pharmacy Stock Levels** — medication names, stock percentages\n"
        "2. **Pollen & Allergens** — pollen indices, risk level\n"
        "3. **Air Quality** — AQI score, dominant pollutant, category\n"
        "4. **Hospital / Urgent Care Busyness** — per-facility busyness\n"
        "5. **Social Media Signals** — sickness mentions, keyword counts\n"
        "6. **Google Trends** — keyword interest scores\n"
        "7. **EMS Dispatch** — call volumes by type\n"
        "8. **CDC Outbreaks** — active outbreaks\n"
        "9. **Self-Reports** — user self-reported symptoms/shortages\n"
        "10. **Summary Observation** — a brief 2-3 sentence overview noting any "
        "initial signals, elevated categories, or notable patterns\n\n"
        "Include ALL numbers and data points — do not summarize or omit details. "
        "The Analyst Agent downstream needs every data point to do its job. "
        "If any source reported a failure, note it clearly.\n\n"
        "IMPORTANT: End your report with the line:\n"
        "'--- RAW SCOUT DATA COMPLETE. READY FOR ANALYST THREAT ASSESSMENT. ---'\n"
        "This data has NOT been analyzed yet. It must be sent to the Analyst Agent next."
    ),
)

# ── Root SequentialAgent (parallel collect → aggregate) ──────────────────────

root_agent = SequentialAgent(
    name="scout_agent",
    description=(
        "Data collection scout for SickSense. Uses a ParallelAgent to "
        "simultaneously gather health-related data from 9 sources, then "
        "aggregates them into a comprehensive city health report."
    ),
    sub_agents=[_parallel_collector, _aggregator],
)
