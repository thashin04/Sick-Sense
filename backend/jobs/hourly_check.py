import asyncio
from datetime import datetime, timezone
from backend.api import scan_all_cities

async def run_hourly_check():
    """
    Triggers the scout agent to pull fresh data for all cities and saves 
    the updated summaries to the database (which the analyst agent handles automatically).
    """
    print(f"[{datetime.now(timezone.utc).isoformat()}] [Scheduler] Starting hourly health scan across all tracked cities...")
    try:
        result = await scan_all_cities()
        print(f"[{datetime.now(timezone.utc).isoformat()}] [Scheduler] Hourly scan finished. Processed {result.get('total', 0)} cities.")
    except Exception as e:
        print(f"[{datetime.now(timezone.utc).isoformat()}] [Scheduler] Error running hourly scan: {e}")
