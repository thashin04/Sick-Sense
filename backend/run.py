import asyncio
import os
import sys
import signal

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import uvicorn
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

os.environ["GOOGLE_MAPS_API_KEY"] = os.getenv("GOOGLE_API_KEY", "")
os.environ["GOOGLE_API_KEY"] = os.getenv("GEMINI_API_KEY", "")

from google.adk.a2a.utils.agent_to_a2a import to_a2a
from backend.agents.scout_agent.agent import root_agent as scout_agent
from backend.agents.analyst_agent.agent import root_agent as analyst_agent
from backend.agents.advisor_agent.agent import root_agent as advisor_agent


def main():
    scout_port = int(os.getenv("SCOUT_PORT", "8001"))
    analyst_port = int(os.getenv("ANALYST_PORT", "8002"))
    advisor_port = int(os.getenv("ADVISOR_PORT", "8003"))
    api_port = int(os.getenv("API_PORT", "8000"))

    # print("=" * 60)
    # print("  SickSense — Multi-Agent Health Outbreak Detection")
    # print("=" * 60)
    # print()
    # print(f"  Scout Agent     → http://localhost:{scout_port}")
    # print(f"  Analyst Agent   → http://localhost:{analyst_port}")
    # print(f"  Advisor Agent   → http://localhost:{advisor_port}")
    # print(f"  API Server      → http://localhost:{api_port}")
    # print()
    # print(f"  Agent Cards:")
    # print(f"    Scout:    http://localhost:{scout_port}/.well-known/agent.json")
    # print(f"    Analyst:  http://localhost:{analyst_port}/.well-known/agent.json")
    # print(f"    Advisor:  http://localhost:{advisor_port}/.well-known/agent.json")
    # print()
    # print("  Temp output folder: backend/output/<city>/")
    # print("=" * 60)

    scout_a2a = to_a2a(scout_agent, port=scout_port)
    analyst_a2a = to_a2a(analyst_agent, port=analyst_port)
    advisor_a2a = to_a2a(advisor_agent, port=advisor_port)

    async def run_all():
        scout_server = uvicorn.Server(uvicorn.Config(
            scout_a2a, host="0.0.0.0", port=scout_port, log_level="info",
        ))
        analyst_server = uvicorn.Server(uvicorn.Config(
            analyst_a2a, host="0.0.0.0", port=analyst_port, log_level="info",
        ))
        advisor_server = uvicorn.Server(uvicorn.Config(
            advisor_a2a, host="0.0.0.0", port=advisor_port, log_level="info",
        ))
        api_server = uvicorn.Server(uvicorn.Config(
            "backend.api:app", host="0.0.0.0", port=api_port, log_level="info",
        ))

        # Initialize background jobs
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        from backend.jobs.hourly_check import run_hourly_check
        from backend.jobs.daily_report import generate_and_save_daily_reports

        scheduler = AsyncIOScheduler()
        scheduler.add_job(run_hourly_check, 'interval', minutes=1, id="hourly_scan") # change minutes to hours
        scheduler.add_job(generate_and_save_daily_reports, 'interval', minutes=2, id="daily_tts_report") # Generate every morning at 7AM; change 'interval' to 'cron' and change minutes=2 to hours=1
        scheduler.start()

        await asyncio.gather(
            scout_server.serve(),
            analyst_server.serve(),
            advisor_server.serve(),
            api_server.serve(),
        )

    try:
        asyncio.run(run_all())
    except KeyboardInterrupt:
        print("\n  Shutting down SickSense...")
        sys.exit(0)


if __name__ == "__main__":
    main()
