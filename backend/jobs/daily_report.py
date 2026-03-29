import os
import json
import asyncio
from datetime import datetime, timezone
from google import genai
from google.genai import types

from backend.db.firebase import init_firebase, get_city_summary
from backend.config.cities import FLORIDA_CITIES

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from backend.orchestrator import create_orchestrator

async def process_city(city_key, city_cfg, client, db, force_refresh=False, skip_scan=False):
    summary = get_city_summary(city_cfg.name)
    needs_refresh = force_refresh if not skip_scan else False

    if not summary:
        needs_refresh = True
    elif not needs_refresh and not skip_scan:
        # Ensure we only use recent data (within the last 24 hours)
        timestamp_str = summary.get("timestamp")
        if timestamp_str:
            try:
                summary_time = datetime.fromisoformat(timestamp_str)
                if (datetime.now(timezone.utc) - summary_time).total_seconds() > 24 * 3600:
                    needs_refresh = True
            except ValueError:
                needs_refresh = True

    if needs_refresh:
        print(f"[{datetime.now(timezone.utc).isoformat()}] [Scheduler] Running emergency scan for {city_cfg.name} (data missing or stale)...")
        try:
            orchestrator = create_orchestrator()
            session_service = InMemorySessionService()
            runner = Runner(agent=orchestrator, app_name="sicksense", session_service=session_service)
            session = await session_service.create_session(app_name="sicksense", user_id="daily_job")
            
            prompt_text = f"Scan primarily for {city_cfg.name}, Florida for health outbreaks, specifically tracking the risks for Seasonal Flu and Common Cold, and check connected cities ONLY if absolutely needed to trace an outbreak. Run the full pipeline."
            user_message = types.Content(role="user", parts=[types.Part(text=prompt_text)])
            
            async for _ in runner.run_async(user_id="daily_job", session_id=session.id, new_message=user_message):
                pass
            
            # Re-fetch after the scan completes
            summary = get_city_summary(city_cfg.name)
            if not summary:
                print(f"[{datetime.now(timezone.utc).isoformat()}] [Scheduler] Skip {city_cfg.name} - fallback scan failed to produce a summary.")
                return
        except Exception as e:
            print(f"[{datetime.now(timezone.utc).isoformat()}] [Scheduler] Failsafe scan error for {city_cfg.name}: {e}")
            return
            
    # System Prompt for the Advisor
    prompt = f"""
    You are the SickSense Health Advisor. Your goal is to provide a comprehensive, data-driven daily health report for {city_cfg.name}.
    
    Current Health Data (JSON):
    {json.dumps(summary)}
    
    INSTRUCTIONS:
    - Write in a natural, professional, yet conversational tone for text-to-speech.
    - BE SPECIFIC: Mention exact risk levels (Low/Moderate/High) for specific illnesses (e.g., flu, cold, or others mention in the data).
    - MENTION INVENTORY: If stock for a specific medication (like Claritin, DayQuil, or Tylenol) is low or notable, include it in your report.
    - ACTIONABLE ADVICE: Provide 1-2 practical tips based on the data provided (e.g., "keep windows closed to minimize pollen," or "wash your hands frequently").
    - PAUSES: Use punctuation (commas, periods, "...") to create natural breathing pauses for the AI voice.
    - LENGTH: Aim for a detailed 60-100 word summary. Do not cut it short.
    - GREETING: Start with a friendly greeting.
    
    Write ONLY the conversational text to be spoken aloud. Do not include any asterisks, bolding, or special formatting.
    """

    try:
        response = await client.aio.models.generate_content(
            model='gemini-3-flash-preview',
            contents=prompt,
        )
        tts_script = response.text.strip()
        
        # Save it to firebase under the new collection
        db.collection("daily_tts_reports").document(city_key).set({
            "city": city_cfg.name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "tts_script": tts_script
        })
        print(f"[{datetime.now(timezone.utc).isoformat()}] [Scheduler] Synthesized daily script for {city_cfg.name}")

    except Exception as e:
        print(f"[{datetime.now(timezone.utc).isoformat()}] [Scheduler] Failed to generate TTS report for {city_key}: {e}")


async def generate_and_save_daily_reports():
    """
    Background job that reads all updated city_health_summaries, passes them 
    through the Gemini model (using the standard REST API), and outputs 
    a TTS-ready conversational string. It saves this output to 'daily_tts_reports'.
    If data is missing or stale, it automatically triggers a fallback Agent scan.
    """
    db = init_firebase()
    if not db:
        print("[Scheduler] Firebase not initialized, skipping daily report.")
        return

    # Use the same API keys provided in orchestrator / run.py context
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY")))
    
    print(f"[{datetime.now(timezone.utc).isoformat()}] [Scheduler] Generating new TTS daily health reports...")

    # Run the processing for all cities in parallel
    tasks = [process_city(city_key, city_cfg, client, db) for city_key, city_cfg in FLORIDA_CITIES.items()]
    await asyncio.gather(*tasks)
