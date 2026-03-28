import os
import json
from datetime import datetime, timezone
from google import genai
from google.genai import types

from backend.db.firebase import init_firebase, get_city_summary
from backend.config.cities import FLORIDA_CITIES

def generate_and_save_daily_reports():
    """
    Background job that reads all updated city_health_summaries, passes them 
    through the Gemini model (using the standard REST API), and outputs 
    a TTS-ready conversational string. It saves this output to 'daily_tts_reports'.
    """
    db = init_firebase()
    if not db:
        print("[Scheduler] Firebase not initialized, skipping daily report.")
        return

    # Use the same API keys provided in orchestrator / run.py context
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY")))
    
    print(f"[{datetime.now(timezone.utc).isoformat()}] [Scheduler] Generating new TTS daily health reports...")

    for city_key, city_cfg in FLORIDA_CITIES.items():
        summary = get_city_summary(city_cfg.name)
        if not summary:
            continue
            
        # Compile prompt tailored specifically for Text-to-Speech synthesis
        prompt = (
            f"You are the SickSense Health Broadcaster. I have the JSON summary of "
            f"the health and illness profile for {city_cfg.name} today:\n\n{json.dumps(summary)}\n\n"
            f"Write a 2-3 sentence conversational brief that reads strictly like a "
            f"helpful voice assistant talking to a user to tell them what illnesses "
            f"are circulating nearby and what precautions they should take. "
            f"Do not include any asterisks, bolding, special formatting, or intro/outro pleasantries that would sound unnatural when read via an automated Text-to-Speech system. "
            f"Write ONLY what will be spoken aloud, word for word."
        )

        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
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
