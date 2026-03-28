"""
SickSense — Analyst Agent.

The Analyst takes raw health data from the Scout and performs anomaly detection
and cross-referencing to determine threat levels. Uses Gemini's reasoning
to identify patterns across data sources.
Exposed as an A2A server on port 8002.
"""

import json

from google.adk.agents import Agent


def analyze_data_for_anomalies(raw_data: str) -> dict:
    """Analyze aggregated health data to detect anomalies and assess threat level.

    This tool receives the raw data collected by the Scout Agent and applies
    anomaly detection logic to identify potential outbreaks.

    Args:
        raw_data: JSON string or text containing the Scout Agent's collected
            data for a city, including pharmacy stocks, pollen, air quality,
            hospital busyness, social media mentions, Google Trends, EMS data,
            and CDC Outbreaks.

    Returns:
        dict with analysis framework including signal categories and
        severity assessment criteria.
    """
    return {
        "analysis_framework": {
            "pharmacy_signals": {
                "description": "Check if OTC med stocks are below 50% of typical",
                "threshold": "Stock < 50% typical = anomaly, < 30% = severe",
            },
            "hospital_signals": {
                "description": "Check if hospital busyness exceeds typical by >30%",
                "threshold": "Busyness > 130% typical = anomaly, > 180% = severe",
            },
            "social_signals": {
                "description": "Check total sickness mentions and keyword density",
                "threshold": "> 10 mentions = elevated, > 25 = high concern",
            },
            "trends_signals": {
                "description": "Check if health keyword interest > 60",
                "threshold": "Interest > 60 = elevated, > 80 = spike",
            },
            "ems_signals": {
                "description": "Check if respiratory/fever calls exceed typical by >25%",
                "threshold": "Calls > 125% typical = anomaly, > 150% = severe",
            },
            "cdc_signals": {
                "description": "Check if there are active outbreaks matching local symptoms",
                "threshold": "Active CDC Outbreak matching local signals = high concern",
            },
            "environmental_context": {
                "description": "Pollen and AQI help differentiate allergies from infections",
                "note": "High pollen + respiratory complaints = likely allergies, not outbreak",
            },
        },
        "cross_reference_rules": [
            "If pharmacy stock LOW + hospital busyness HIGH + social mentions HIGH → strong outbreak signal",
            "If pollen HIGH + respiratory complaints HIGH but pharmacy normal → likely seasonal allergies",
            "If EMS calls elevated + hospital busyness elevated → healthcare system strain",
            "If Google Trends spiking for 'flu symptoms' + pharmacy depleted → flu outbreak likely",
        ],
        "threat_scoring": {
            "0-20": "None — all signals within normal range",
            "21-40": "Low — minor anomalies in 1-2 sources",
            "41-60": "Moderate — concerning signals across multiple sources",
            "61-80": "High — strong evidence of outbreak from correlated sources",
            "81-100": "Critical — multiple severe anomalies with cross-source confirmation",
        },
        "instructions": (
            "Apply the above framework to the raw data. For each source, determine if "
            "an anomaly exists and its severity. Then cross-reference signals to determine "
            "the overall threat score (0-100), threat level, identified conditions, and a "
            "list of specific anomalies found. Also identify any conditions (flu, cold, "
            "respiratory illness, stomach bug, allergies, etc.)."
        ),
    }


root_agent = Agent(
    name="analyst_agent",
    model="gemini-3-flash-preview",
    description=(
        "Anomaly detection analyst for SickSense. Examines collected health data "
        "to identify statistical anomalies, cross-references signals across sources, "
        "and produces a threat assessment with confidence scores."
    ),
    instruction=(
        "You are the Analyst Agent for SickSense. You receive raw health data collected "
        "by the Scout Agent and must analyze it for signs of a local health outbreak.\n\n"
        "Your job:\n"
        "1. Call the analyze_data_for_anomalies tool with the raw data to get the analysis framework\n"
        "2. Apply the framework to the actual data provided\n"
        "3. For each data source, determine if there are anomalies and their severity\n"
        "4. Cross-reference signals (e.g., pharmacy stock low + hospital busy + social mentions high)\n"
        "5. Differentiate between allergies and actual illness using environmental context\n"
        "6. Produce a final assessment with:\n"
        "   - threat_score: 0-100 integer\n"
        "   - threat_level: none / low / moderate / high / critical\n"
        "   - identified_conditions: list of suspected conditions\n"
        "   - anomalies: list of specific anomalies found with source and severity\n"
        "   - cross_references: observations about correlated signals\n\n"
        "Be data-driven and specific. Cite actual numbers from the data."
    ),
    tools=[analyze_data_for_anomalies],
)
