import os

from google.adk.agents import Agent
from google.adk.agents.remote_a2a_agent import RemoteA2aAgent


def create_orchestrator() -> Agent:
    """Create the root orchestrator agent with remote A2A sub-agents.

    Returns:
        An ADK Agent configured with 3 remote A2A agents as sub-agents.
    """
    scout_port = os.getenv("SCOUT_PORT", "8001")
    analyst_port = os.getenv("ANALYST_PORT", "8002")
    advisor_port = os.getenv("ADVISOR_PORT", "8003")

    remote_scout = RemoteA2aAgent(
        name="scout",
        description=(
            "Data collection scout that gathers health data from 7 sources "
            "(pharmacy, pollen, air quality, hospitals, social media, "
            "Google Trends, EMS dispatch) for a given Florida city."
        ),
        agent_card=f"http://localhost:{scout_port}",
    )

    remote_analyst = RemoteA2aAgent(
        name="analyst",
        description=(
            "Anomaly detection analyst that examines collected health data, "
            "identifies statistical anomalies, cross-references signals, and "
            "produces a threat assessment with score and identified conditions."
        ),
        agent_card=f"http://localhost:{analyst_port}",
    )

    remote_advisor = RemoteA2aAgent(
        name="advisor",
        description=(
            "Health advisory generator that translates threat assessments into "
            "plain-language advisories with actionable precautions and "
            "recommendations for the general public."
        ),
        agent_card=f"http://localhost:{advisor_port}",
    )

    root_agent = Agent(
        name="sicksense_orchestrator",
        model="gemini-3-flash-preview",
        description=(
            "Root orchestrator for SickSense health outbreak detection. "
            "Coordinates data collection, analysis, and advisory generation "
            "for Florida cities."
        ),
        instruction=(
            "You are the SickSense orchestrator. When a user asks you to scan a city "
            "for health outbreaks, follow this EXACT pipeline:\n\n"
            "1. SCOUT PHASE: Delegate to the 'scout' agent with the city name. "
            "   The scout will collect data from all 7 health data sources.\n"
            "2. ANALYST PHASE: Take the scout's complete data and send it to the "
            "   'analyst' agent for anomaly detection and threat assessment.\n"
            "3. ADVISOR PHASE: Take the analyst's threat assessment and send it to "
            "   the 'advisor' agent to generate a plain-language health advisory.\n\n"
            "After all 3 phases complete, compile and present the final outbreak report "
            "including:\n"
            "- City name and scan timestamp\n"
            "- Threat score (0-100) and threat level\n"
            "- Identified conditions\n"
            "- Plain-language advisory\n"
            "- Precautions and recommended actions\n"
            "- Data sources used and key anomalies found\n\n"
            "Supported cities: Tallahassee, Gainesville, Jacksonville, Tampa, "
            "Orlando, Miami, Fort Lauderdale\n\n"
            "Always run the FULL pipeline — do not skip any agent."
        ),
        sub_agents=[remote_scout, remote_analyst, remote_advisor],
    )

    return root_agent
