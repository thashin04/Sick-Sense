import os
import json
import logging
from datetime import datetime, timezone

import httpx
from google import genai
from google.genai import types

from backend.config.schemas import CDCOutbreakReport, CDCOutbreak
from backend.collectors.output_utils import save_collector_output

logger = logging.getLogger(__name__)

# fallback
MOCK_OUTBREAKS = [
    CDCOutbreak(
        pathogen="Listeria",
        locations_affected=["Nationwide", "Florida"],
        status="Active Warning",
        date_updated="Recent",
        description="Outbreak linked to deli meats."
    ),
    CDCOutbreak(
        pathogen="Measles",
        locations_affected=["Florida (Broward County)", "New York"],
        status="Active Investigation",
        date_updated="Recent",
        description="Local transmission cases confirmed in un-vaccinated populations."
    )
]


async def collect(city: str) -> CDCOutbreakReport:
    url = "https://www.cdc.gov/outbreaks/index.html"
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=10.0)
            resp.raise_for_status()
            html_text = resp.text
            
            # truncate to save tokens (first ~25000 chars is plenty for the main list)
            content_snippet = html_text[:25000]

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment.")

        genai_client = genai.Client(api_key=api_key)
        
        prompt = (
            "You are a public health parser. Review the following raw HTML text from the CDC Outbreaks page. "
            "Extract the 3 to 5 most recent or prominent disease outbreak investigations. "
            "Ignore food recalls that don't result in outbreak illnesses (e.g. unlabeled allergens). "
            "Format the output strictly as a JSON array where each object has keys: "
            "'pathogen', 'locations_affected' (list of strings), 'status', 'date_updated', and 'description'."
            f"\n\nHTML CONTENT:\n{content_snippet}"
        )

        response = genai_client.models.generate_content(
            model='gemini-3-flash-preview',  # standard fast model for text extraction
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1,
            )
        )
        
        # 3. Parse JSON response
        raw_json = response.text
        if not raw_json:
            raise ValueError("LLM returned empty text.")
            
        outbreaks_data = json.loads(raw_json)
        
        # Map to Pydantic
        active_outbreaks = []
        for item in outbreaks_data:
            # Safely handle potential schema mismatches from pure JSON mode
            active_outbreaks.append(CDCOutbreak(
                pathogen=item.get("pathogen", "Unknown Pathogen"),
                locations_affected=item.get("locations_affected", ["Unknown Location"]),
                status=item.get("status", "Active"),
                date_updated=item.get("date_updated", "Recent"),
                description=item.get("description", "No detailed description.")
            ))

        report = CDCOutbreakReport(
            city=city,
            timestamp=datetime.now(timezone.utc),
            active_outbreaks=active_outbreaks,
            source="cdc_ai_scraper"
        )
            
    except Exception as e:
        logger.warning(f"[cdc_outbreaks] Failed to scrape CDC via LLM for {city}: {e} — falling back to mock")
        report = CDCOutbreakReport(
            city=city,
            timestamp=datetime.now(timezone.utc),
            active_outbreaks=MOCK_OUTBREAKS,
            source="mock_fallback"
        )

    save_collector_output(city, "cdc_outbreaks", report)
    return report
