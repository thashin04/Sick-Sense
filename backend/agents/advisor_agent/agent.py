"""
SickSense — Advisor Agent.

The Advisor takes the Analyst's threat assessment and generates
plain-language health advisories with actionable recommendations.
Keeps language simple and accessible — no medical jargon.
Exposed as an A2A server on port 8003.
"""

from google.adk.agents import Agent


def get_advisory_guidelines(threat_level: str) -> dict:
    """Get guidelines for generating health advisories based on threat level.

    Args:
        threat_level: The assessed threat level — one of:
            "none", "low", "moderate", "high", "critical"

    Returns:
        dict with advisory templates, tone guidelines, and action categories.
    """
    guidelines = {
        "none": {
            "tone": "Reassuring — everything looks normal",
            "advisory_focus": "General wellness tips, reminder to wash hands",
            "precaution_level": "Minimal — standard hygiene",
            "actions": ["Stay hydrated", "Wash hands regularly", "Get enough sleep"],
        },
        "low": {
            "tone": "Calm but informative — minor signals detected",
            "advisory_focus": "Mention what was detected, suggest basic precautions",
            "precaution_level": "Light — be aware but no major changes needed",
            "actions": [
                "Keep basic cold/flu medicine at home",
                "Wash hands more frequently",
                "Monitor for symptoms",
            ],
        },
        "moderate": {
            "tone": "Attentive — something is developing in the area",
            "advisory_focus": "Clearly state what's happening and what to watch for",
            "precaution_level": "Moderate — consider adjusting behavior",
            "actions": [
                "Stock up on OTC medications before they run low",
                "Avoid crowded indoor spaces if possible",
                "If you have symptoms, stay home and rest",
                "Consider wearing a mask in busy public areas",
                "Keep immunocompromised family members informed",
            ],
        },
        "high": {
            "tone": "Urgent but not panic-inducing — multiple strong signals",
            "advisory_focus": "Specifics about the outbreak, affected areas, and protective steps",
            "precaution_level": "Significant — actively change daily behavior",
            "actions": [
                "Avoid unnecessary trips to crowded places",
                "Wear a mask in indoor public spaces",
                "Stock up on medications NOW — supplies are running low",
                "If you feel sick, call your doctor before visiting",
                "Keep elderly and immunocompromised people away from crowds",
                "Increase disinfection of commonly touched surfaces",
            ],
        },
        "critical": {
            "tone": "Serious and direct — community health concern",
            "advisory_focus": "Outbreak confirmed by multiple data sources, immediate action needed",
            "precaution_level": "Maximum — take this seriously",
            "actions": [
                "Strongly avoid crowded indoor venues",
                "Wear a mask in ALL public spaces",
                "Pharmacies are depleted — try online ordering or neighboring cities",
                "If you develop symptoms, isolate and call a healthcare provider",
                "Do NOT go to the ER unless it's an emergency — they are overwhelmed",
                "Consider telehealth for non-emergency consultations",
                "Alert vulnerable family and friends in the area",
                "Ensure you have 3-5 days of medications at home",
            ],
        },
    }

    return guidelines.get(threat_level, guidelines["moderate"])


def save_advice_to_db(
    city: str,
    overall_forecast: str,
    health_tips: list[dict]
) -> dict:
    """Save structured health tips and overall forecast to the database.

    Args:
        city: The name of the city.
        overall_forecast: A short summary (e.g., 'The local risk level is Low today').
        health_tips: A list of dicts with 'icon' (Ionicons name) and 'text' (the tip). 
                     Icons MUST be from the Authorized Registry.

    Returns:
        dict confirming save success or failure.
    """
    from backend.db.firebase import save_city_summary
    from backend.config.cities import get_city
    
    try:
        # Resolve standardized city name (e.g. "Tampa, Florida" -> "Tampa")
        city_cfg = get_city(city)
        standard_city = city_cfg.name
        
        success = save_city_summary(standard_city, {
            "forecast": overall_forecast,
            "health_tips": health_tips
        })
        if success:
            return {"status": "SUCCESS", "message": f"Saved advice for {city}."}
        else:
            return {"error": "Failed to save to database."}
    except Exception as e:
        return {"error": str(e)}


root_agent = Agent(
    name="advisor_agent",
    model="gemini-3-flash-preview",
    description=(
        "Health advisory generator for SickSense. Translates analytical threat "
        "assessments into plain-language health advisories with actionable "
        "precautions and recommendations for the general public."
    ),
    instruction=(
        "You are the Advisor Agent for SickSense. You receive a threat assessment "
        "from the Analyst Agent and must generate a helpful, easy-to-understand "
        "health advisory.\n\n"
        "AUTHORIZED ICON REGISTRY (Use ONLY these exact Ionicons names):\n"
        "- 'walk' (outdoor activity/pollen)\n"
        "- 'hand-left' (hand washing/hygiene)\n"
        "- 'medkit' (medicine/stocking up)\n"
        "- 'people' (crowded spaces/distancing)\n"
        "- 'water' (hydration)\n"
        "- 'thermometer' (fever/sickness monitoring)\n"
        "- 'fitness' (general health)\n"
        "- 'alert-circle' (urgent warnings)\n\n"
        "STEPS:\n"
        "1. Identify the 'threat_level' (none/low/moderate/high/critical) from the "
        "   Analyst's assessment. You MUST use this exact level when calling "
        "   get_advisory_guidelines.\n"
        "2. Call get_advisory_guidelines with that threat_level.\n"
        "2. Generate 5 short, actionable 'Today's Health Tips'. Each tip must have an icon from the registry.\n"
        "3. Determine the overall 'Health Forecast' sentence. This sentence MUST "
        "   use the exact 'threat_level' label identified in Step 1 (e.g. "
        "   'The local risk level is High today').\n"
        "4. Call save_advice_to_db to persist this structured data.\n"
        "5. Finally, provide a friendly 2-4 sentence summary as your main response.\n\n"
        "CRITICAL RULES:\n"
        "- NO medical jargon.\n"
        "- NEVER use icons outside the Authorized Registry.\n"
        "- Keep tips concise and extremely practical."
    ),
    tools=[get_advisory_guidelines, save_advice_to_db],
)
