"""
SickSense — Hospital busyness collector.

Uses the Google Maps busyness scraper (Safari/AppleScript) to get live
"Popular Times" data for hospitals. Falls back to mock data when Safari
is unavailable (e.g., in CI or non-macOS environments).
"""

import asyncio
import random
import sys
from datetime import datetime, timezone

from backend.config.cities import get_city
from backend.config.schemas import HospitalBusyness, HospitalReport
from backend.collectors.output_utils import save_collector_output


# ---------------------------------------------------------------------------
# Safari scraper bridge
# ---------------------------------------------------------------------------

def _scrape_hospital_busyness(hospital_name: str, city_name: str) -> dict:
    """Run the busyness scraper for a single hospital. Must run in thread.
    
    Returns dict with live_busyness_pct, usual_busyness_pct, place_name, etc.
    """
    import time
    # Import here so the module loads even without Safari/macOS
    from backend.scrapers.busyness import (
        open_maps_page,
        click_first_result,
        scroll_detail_panel,
        scrape_busyness,
    )
    from backend.collectors.safari_lock import acquire_safari_lock
    
    with acquire_safari_lock():
        query = f"{hospital_name}, {city_name}, FL"
        
        # Open Google Maps search (give it more time to load)
        open_maps_page(query, wait_seconds=10)
        
        # Click first result to get place detail (passing hospital_name to avoid Sponsored ads)
        place_name = ""
        for _ in range(3):
            place_name = click_first_result(target_name=hospital_name)
            if place_name: break
            time.sleep(5)
            
        if not place_name:
            return {"error": "No result found", "place_name": hospital_name}
        
        # If already on place page (single result), we can skip clicking
        already_on_place = place_name.startswith("ALREADY_ON_PLACE:")
        
        # Wait for place detail panel to fully load
        time.sleep(5)
        
        # Scroll to trigger lazy-loading of Popular Times
        scroll_detail_panel()
        
        # Extra scroll and wait for complete rendering
        time.sleep(2)
        scroll_detail_panel()
        
        # Scrape the busyness data
        data = scrape_busyness()
        data["place_name"] = data.get("place_name") or hospital_name
        return data


async def _fetch_live(city: str) -> list[HospitalBusyness]:
    """Scrape busyness for all hospitals in a city via Safari."""
    city_cfg = get_city(city)
    hospitals = []
    got_any_data = False

    for name in city_cfg.hospitals:
        try:
            data = await asyncio.to_thread(_scrape_hospital_busyness, name, city_cfg.name)

            live_pct = data.get("live_busyness_pct")
            usual_pct = data.get("usual_busyness_pct")
            popular_times = data.get("popular_times", [])
            place_name = data.get("place_name", name)

            if live_pct is not None:
                # Best case: Google is showing live busyness
                got_any_data = True
                hospitals.append(HospitalBusyness(
                    name=place_name,
                    busyness_pct=live_pct,
                    typical_pct=usual_pct or live_pct,
                    is_elevated=live_pct > (usual_pct or live_pct) * 1.3 if usual_pct else False,
                ))

            elif popular_times:
                # Fallback: use popular times histogram for current hour
                got_any_data = True
                now_hour = datetime.now().strftime("%-I %p")  # e.g. "7 PM"
                current_entry = None
                for entry in popular_times:
                    if entry.get("time", "").strip().upper() == now_hour.upper():
                        current_entry = entry
                        break
                
                if current_entry:
                    pct = current_entry["pct"]
                    typ = current_entry.get("usual_pct", pct)
                else:
                    # Use average of all entries
                    pct = sum(e["pct"] for e in popular_times) // len(popular_times)
                    typ = pct

                hospitals.append(HospitalBusyness(
                    name=place_name,
                    busyness_pct=pct,
                    typical_pct=typ,
                    is_elevated=pct > typ * 1.3 if typ else False,
                ))
            else:
                # No data at all — skip, will use mock
                print(f"[hospital_busyness] No busyness data for {name}")

        except Exception as e:
            print(f"[hospital_busyness] Scrape failed for {name}: {e}")
            continue

    # If we got no real data for any hospital, return empty to trigger mock
    if not got_any_data:
        return []
    return hospitals


# ---------------------------------------------------------------------------
# Mock fallback
# ---------------------------------------------------------------------------

def _generate_mock(city: str) -> HospitalReport:
    """Generate mock hospital busyness data."""
    city_cfg = get_city(city)

    seed_modifier = sum(ord(c) for c in city.lower())
    random.seed(int(datetime.now().timestamp() / 3600) + seed_modifier)

    hospitals = []
    for name in city_cfg.hospitals:
        typical = random.randint(35, 65)
        current = min(100, typical + random.randint(-10, 15))
        hospitals.append(HospitalBusyness(
            name=name,
            busyness_pct=current,
            typical_pct=typical,
            is_elevated=current > typical * 1.3,
        ))

    random.seed()

    return HospitalReport(
        city=city,
        timestamp=datetime.now(timezone.utc),
        hospitals=hospitals,
        source="mock",
    )


# ---------------------------------------------------------------------------
# Main collector
# ---------------------------------------------------------------------------

async def collect(city: str) -> HospitalReport:
    """Collect hospital busyness data — live via Safari or mock fallback.

    Args:
        city: City name (e.g. "Orlando", "Tampa")

    Returns:
        HospitalReport with per-hospital busyness scores.
    """
    try:
        # Only attempt Safari scraping on macOS
        if sys.platform != "darwin":
            raise RuntimeError("Safari scraping only available on macOS")

        hospitals = await _fetch_live(city)

        if not hospitals:
            report = _generate_mock(city)
            save_collector_output(city, "hospital_busyness", report)
            return report

        report = HospitalReport(
            city=city,
            timestamp=datetime.now(timezone.utc),
            hospitals=hospitals,
            source="google_maps_safari",
        )

    except Exception as e:
        print(f"[hospital_busyness] Live fetch failed for {city}: {e}")
        report = _generate_mock(city)

    save_collector_output(city, "hospital_busyness", report)
    return report
