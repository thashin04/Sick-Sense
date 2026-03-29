"""
SickSense — Analyst Agent (LoopAgent with self-correction).

The Analyst takes raw health data from the Scout and performs anomaly detection
and cross-referencing to determine threat levels.  It is wrapped in a LoopAgent
so it can validate and self-correct its own assessment before returning.
Exposed as an A2A server on port 8002.
"""

import json

from google.adk.agents import Agent, LoopAgent
from google.adk.tools import ToolContext


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


def validate_assessment(assessment_text: str) -> dict:
    """Validate a draft threat assessment for internal consistency.

    This tool checks whether the analyst's draft assessment is logically
    consistent. It returns a validation checklist that the analyst must
    use to decide whether to accept or revise its assessment.

    Args:
        assessment_text: The full text of the analyst's draft threat
            assessment, including threat_score, threat_level, anomalies,
            and cross_references.

    Returns:
        dict with a validation checklist of consistency rules to verify.
    """
    return {
        "validation_checklist": [
            "Does the threat_score numerically match the threat_level label? "
            "(e.g., score 25 should be 'low', not 'moderate')",
            "Are ALL data sources accounted for in the anomalies list, even "
            "those with no anomaly (listed as 'normal')?",
            "Does every cross_reference cite specific numbers from the raw data?",
            "Are the identified_conditions supported by at least 2 corroborating "
            "data sources?",
            "If pollen is HIGH and the condition is 'respiratory illness', was "
            "the allergy vs. infection distinction explicitly addressed?",
            "Is the threat_score inflated by hallucinated data not present in "
            "the original scout report?",
        ],
        "action": (
            "Review each item above against your draft. If ANY check fails, "
            "you MUST revise the assessment and output the corrected version. "
            "If ALL checks pass, call the finalize_assessment tool to lock in "
            "your result and exit the validation loop."
        ),
    }


def finalize_assessment(
    final_assessment: str, tool_context: ToolContext
) -> dict:
    """Finalize and lock in the validated threat assessment.

    Call this tool ONLY after all validation checks have passed.
    It signals that the self-correction loop is complete and the
    assessment is ready to be sent to the Advisor Agent.

    Args:
        final_assessment: The complete, validated threat assessment text.
        tool_context: Injected by ADK — provides access to loop control.

    Returns:
        dict confirming the assessment has been finalized.
    """
    tool_context.actions.escalate = True
    return {
        "status": "ASSESSMENT VALIDATED — FINALIZED",
        "message": "Self-correction loop complete. Assessment locked in.",
    }


def save_risk_and_stock_to_db(
    city: str,
    seasonal_flu_risk: str,
    common_cold_risk: str,
    other_viruses_risk: dict,
    otc_stock: list[dict]
) -> dict:
    """Save the local risk levels and OTC stock status to the database.

    Args:
        city: The name of the city.
        seasonal_flu_risk: Risk level for Seasonal Flu (e.g., 'Low', 'High').
        common_cold_risk: Risk level for Common Cold (e.g., 'Low', 'High').
        other_viruses_risk: Dictionary mapping any other suspected viruses/illnesses to their risk levels based on the data.
        otc_stock: List of dictionaries. Each must contain 'name' (medication name), 'status' ('In Stock' or 'Limited'), and 'stock_level' (the raw percentage or count).

    Returns:
        dict confirming save success or failure.
    """
    from backend.db.firebase import init_firebase
    from datetime import datetime, timezone
    
    db = init_firebase()
    if not db:
        return {"error": "Firebase not initialized."}
        
    try:
        doc_ref = db.collection("city_health_summaries").document(city)
        now_iso = datetime.now(timezone.utc).isoformat()
        
        doc_ref.set({
            "city": city,
            "timestamp": now_iso,
            "local_risk_levels": {
                "seasonal_flu": seasonal_flu_risk,
                "common_cold": common_cold_risk,
                **other_viruses_risk
            },
            "otc_stock": [
                {
                    "name": item.get("name"),
                    "status": item.get("status"),
                    "stock_level": item.get("stock_level"),
                    "updated_at": now_iso
                } for item in otc_stock
            ]
        })
        return {"status": "SUCCESS", "message": f"Saved summary for {city} to city_health_summaries."}
    except Exception as e:
        return {"error": str(e)}


# ── Inner analysis agent ────────────────────────────────────────────────────

_analysis_agent = Agent(
    name="analyst_core",
    model="gemini-3-flash-preview",
    description=(
        "Core anomaly detection analyst. Examines collected health data, "
        "identifies statistical anomalies, cross-references signals, and "
        "produces a threat assessment with confidence scores."
    ),
    instruction=(
        "You are the Analyst Agent for SickSense, running inside a self-correction "
        "loop. You receive raw health data collected by the Scout Agent and must "
        "analyze it for signs of a local health outbreak.\n\n"
        "PHASE 1 — DRAFT ASSESSMENT:\n"
        "1. Call the analyze_data_for_anomalies tool with the raw data to get "
        "   the analysis framework.\n"
        "2. Apply the framework to the actual data provided.\n"
        "3. For each data source, determine if there are anomalies and their severity.\n"
        "4. Cross-reference signals (e.g., pharmacy stock low + hospital busy + "
        "   social mentions high).\n"
        "5. Differentiate between allergies and actual illness using environmental context.\n"
        "6. Produce a DRAFT assessment with:\n"
        "   - threat_score: 0-100 integer\n"
        "   - threat_level: none / low / moderate / high / critical\n"
        "   - identified_conditions: list of suspected conditions\n"
        "   - anomalies: list of specific anomalies found with source and severity\n"
        "   - cross_references: observations about correlated signals\n\n"
        "PHASE 2 — SELF-VALIDATION:\n"
        "7. Call the validate_assessment tool with your draft assessment text.\n"
        "8. Carefully check every item in the validation checklist against your draft.\n"
        "9. If ANY check fails, revise your assessment and call validate_assessment "
        "   again with the corrected version.\n"
        "10. Once ALL checks pass, you MUST call save_risk_and_stock_to_db to persist specific data:\n"
        "    - Determine localized risk levels for Seasonal Flu and Common Cold based on the data.\n"
        "    - Identify ANY other specific sicknesses (e.g. COVID, stomach bug, strep) active in the area and their risk levels.\n"
        "    - Extract ALL OTC stock data provided by the Scout. Set status to 'Limited' if stock < 50%, else 'In Stock'. Include the absolute stock_level value.\n"
        "11. After saving, call the finalize_assessment tool with your "
        "    complete final assessment to lock it in and exit the loop.\n\n"
        "IMPORTANT: You MUST call finalize_assessment when done. Do NOT just output "
        "text — the loop will not stop until you call finalize_assessment.\n\n"
        "Be data-driven and specific. Cite actual numbers from the data. "
        "Never fabricate data points that were not in the scout report."
    ),
    tools=[analyze_data_for_anomalies, validate_assessment, save_risk_and_stock_to_db, finalize_assessment],
)

# ── Root LoopAgent (self-correction wrapper) ─────────────────────────────────

root_agent = LoopAgent(
    name="analyst_agent",
    description=(
        "Self-correcting anomaly detection analyst for SickSense. Wraps the "
        "core analyst in a loop that validates its own threat assessment for "
        "internal consistency and catches hallucinations before returning."
    ),
    sub_agents=[_analysis_agent],
    max_iterations=3,
)
