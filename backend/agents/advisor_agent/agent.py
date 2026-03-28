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
        "health advisory for regular people.\n\n"
        "CRITICAL RULES:\n"
        "1. NO medical jargon — write like you're texting a friend's parent\n"
        "2. Be specific — mention the city name, what's detected, and exact actions\n"
        "3. Call the get_advisory_guidelines tool with the threat level to get tone/action guidelines\n"
        "4. Include the following in your response:\n"
        "   - advisory: A 2-4 sentence plain-language summary of the health situation\n"
        "   - precautions: Specific things people should do to stay safe\n"
        "   - recommended_actions: Concrete next steps (buy medicine, wear mask, etc.)\n"
        "   - safe_areas_note: If applicable, note about safer areas or times\n"
        "5. Tailor advice for vulnerable groups (kids, elderly, immunocompromised)\n"
        "6. Be honest but not panic-inducing — factual and calm\n\n"
        "Your output should feel like a helpful notification someone gets on their phone."
    ),
    tools=[get_advisory_guidelines],
)
