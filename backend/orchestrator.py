import os

from google.adk.agents import Agent, SequentialAgent
from google.adk.agents.remote_a2a_agent import RemoteA2aAgent


def create_orchestrator() -> SequentialAgent:
    """Create the root orchestrator agent with remote A2A sub-agents.

    Uses a SequentialAgent to guarantee the full pipeline runs:
    Scout → Analyst → Advisor.  Each agent's output flows into the
    next via the shared conversation context.

    Returns:
        A SequentialAgent that chains the 3 remote A2A agents.
    """
    scout_port = os.getenv("SCOUT_PORT", "8001")
    analyst_port = os.getenv("ANALYST_PORT", "8002")
    advisor_port = os.getenv("ADVISOR_PORT", "8003")

    remote_scout = RemoteA2aAgent(
        name="scout",
        description=(
            "Data collection scout that gathers health data from 8 sources "
            "(pharmacy, pollen, air quality, hospitals, social media, "
            "Google Trends, EMS dispatch, CDC outbreaks) for a given Florida city."
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

    root_agent = SequentialAgent(
        name="sicksense_orchestrator",
        description=(
            "Root orchestrator for SickSense health outbreak detection. "
            "Runs the full Scout → Analyst → Advisor pipeline sequentially "
            "for Florida cities."
        ),
        sub_agents=[remote_scout, remote_analyst, remote_advisor],
    )

    return root_agent
