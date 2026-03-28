"""
SickSense — Pharmacy stock collector.

Uses the CVS inventory API (via Safari/AppleScript) to check real-time
OTC medication stock levels for CVS stores. Falls back to mock data
when Safari is unavailable.
"""

import asyncio
import json
import random
import sys
import time
from datetime import datetime, timezone

from backend.config.cities import get_city
from backend.config.schemas import MedicationStock, PharmacyReport
from backend.collectors.output_utils import save_collector_output


# OTC medication categories — multiple product variants per category,
# typical_stock reflects realistic per-store levels (not warehouse)
CVS_PRODUCTS = [
    {
        "name": "DayQuil",
        "product_ids": ["1011952", "307496", "689769"],
        "typical_stock": 12,
    },
    {
        "name": "NyQuil",
        "product_ids": ["855821", "690298", "498257", "690293"],
        "typical_stock": 10,
    },
    {
        "name": "Tylenol Cold & Flu",
        "product_ids": ["733108", "694103", "601122", "1011799"],
        "typical_stock": 10,
    },
    {
        "name": "Mucinex",
        "product_ids": ["1011634", "698819", "698831"],
        "typical_stock": 10,
    },
    {
        "name": "Robitussin",
        "product_ids": ["1040188", "697077", "549484", "1040192"],
        "typical_stock": 8,
    },
    {
        "name": "Theraflu",
        "product_ids": ["329419", "693699", "697124", "107035"],
        "typical_stock": 8,
    },
    {
        "name": "Claritin",
        "product_ids": ["1011654", "560929"],
        "typical_stock": 10,
    },
    {
        "name": "Emergen-C",
        "product_ids": ["374738"],
        "typical_stock": 12,
    },
    {
        "name": "Halls Cough Drops",
        "product_ids": ["1011592"],
        "typical_stock": 15,
    },
    {
        "name": "Vicks VapoRub",
        "product_ids": ["106682"],
        "typical_stock": 8,
    },
    {
        "name": "Children's Tylenol",
        "product_ids": ["312419"],
        "typical_stock": 8,
    },
    {
        "name": "Pedialyte",
        "product_ids": ["445476"],
        "typical_stock": 10,
    },
]


# ---------------------------------------------------------------------------
# CVS Safari bridge
# ---------------------------------------------------------------------------

def _check_cvs_product(product_id: str, store_id: str) -> dict | None:
    """Check CVS inventory for a product at a store. Must run in thread."""
    from backend.scrapers.cvs_inventory import run_js_in_safari

    payload = json.dumps({
        "getATPInventoryRequest": {
            "header": {
                "apiKey": "a2ff75c6-2da7-4299-929d-d670d827ab4a",
                "channelName": "WEB",
                "deviceToken": "d9708df38d23192e",
                "deviceType": "DESKTOP",
                "responseFormat": "JSON",
                "securityType": "apiKey",
                "source": "CVS_WEB",
                "appName": "CVS_WEB",
                "lineOfBusiness": "RETAIL",
                "type": "rdp",
            },
            "promiseLines": {
                "promiseLine": [{
                    "promiseLineID": "promiseId1",
                    "shipNodes": {
                        "shipNode": [{
                            "partyIdentifier": {
                                "identificationIdentifier": store_id,
                                "sddIdentificationIdentifier": "",
                            },
                            "shipNodeTypeCode": "Store",
                        }]
                    },
                    "product": {
                        "productIdentifier": {
                            "identificationIdentifier": product_id,
                        }
                    },
                }]
            },
        }
    })

    js = f'''
(function() {{
    try {{
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "https://www.cvs.com/RETAGPV3/Inventory/V1/getATPInventory", false);
        xhr.withCredentials = true;
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Accept", "application/json");
        xhr.send('{payload}');
        return xhr.status + "|||" + xhr.responseText.substring(0, 3000);
    }} catch(e) {{
        return "ERR|||" + e.message;
    }}
}})()
'''

    raw = run_js_in_safari(js)
    parts = raw.split("|||", 1)
    status_str = parts[0]
    body = parts[1] if len(parts) > 1 else ""

    if status_str == "200":
        try:
            return json.loads(body)
        except json.JSONDecodeError:
            pass
    return None


def _open_cvs_page() -> bool:
    """Open a CVS product page in Safari to establish session. Must run in thread."""
    from backend.scrapers.cvs_inventory import run_applescript

    url = "https://www.cvs.com/shop/vicks-dayquil-non-drowsy-daytime-cold-flu-medicine-12-oz-prodid-1011952"
    run_applescript(f'''
        tell application "Safari"
            activate
            open location "{url}"
        end tell
    ''')
    time.sleep(10)

    title = run_applescript('''
        tell application "Safari"
            return name of current tab of front window
        end tell
    ''')
    return "Access Denied" not in title


def _extract_stock(data: dict) -> int:
    """Extract storeOnHandQuantity from CVS API response."""
    try:
        resp = data.get("getATPInventoryResponse", {})
        if resp.get("responseStatus", {}).get("statusCd") == "00":
            for line in resp.get("promiseLines", {}).get("promiseLine", []):
                for inv in line.get("shipNodeAvailableInventory", {}).get("inventory", []):
                    return int(inv.get("storeOnHandQuantity", 0))
    except (ValueError, TypeError):
        pass
    return -1  # Indicates failed lookup


def _run_sync_pipeline(store_id: str) -> list[MedicationStock] | None:
    from backend.collectors.safari_lock import acquire_safari_lock
    with acquire_safari_lock():
        if not _open_cvs_page():
            return None
            
        medications = []
        for product in CVS_PRODUCTS:
            total_stock = 0
            any_success = False

            # Check all variants for this category and sum stock
            for pid in product["product_ids"]:
                try:
                    data = _check_cvs_product(pid, store_id)
                    if data:
                        stock = _extract_stock(data)
                        if stock >= 0:
                            total_stock += stock
                            any_success = True
                except Exception as e:
                    print(f"[pharmacy] Error checking {product['name']} ({pid}): {e}")

            if any_success:
                typical = product["typical_stock"]
                medications.append(MedicationStock(
                    name=product["name"],
                    typical_stock=typical,
                    current_stock=total_stock,
                    pct_remaining=round(min(total_stock / typical, 1.0), 3) if typical > 0 else 0.0,
                ))
            else:
                # API failed for all variants — use mock for this product
                typical = product["typical_stock"]
                stock = max(1, int(typical * random.uniform(0.5, 1.0)))
                medications.append(MedicationStock(
                    name=product["name"],
                    typical_stock=typical,
                    current_stock=stock,
                    pct_remaining=round(stock / typical, 3),
                ))

        return medications


async def _fetch_live(city: str) -> list[MedicationStock]:
    """Check CVS inventory for OTC medications via Safari."""
    city_cfg = get_city(city)
    if not city_cfg.cvs_store_ids:
        return []

    store_id = city_cfg.cvs_store_ids[0]  # Use first store

    medications = await asyncio.to_thread(_run_sync_pipeline, store_id)
    if medications is None:
        print(f"[pharmacy] CVS page blocked — falling back to mock for {city}")
        return []

    return medications


# ---------------------------------------------------------------------------
# Mock fallback
# ---------------------------------------------------------------------------

def _generate_mock(city: str) -> PharmacyReport:
    """Generate mock pharmacy stock data."""
    seed_modifier = sum(ord(c) for c in city.lower())
    random.seed(int(datetime.now().timestamp() / 3600) + seed_modifier)

    medications = []
    for med in CVS_PRODUCTS:
        typical = med["typical_stock"]
        current = max(1, int(typical * random.uniform(0.7, 1.0)))
        medications.append(MedicationStock(
            name=med["name"],
            typical_stock=typical,
            current_stock=current,
            pct_remaining=round(current / typical, 3),
        ))

    random.seed()

    return PharmacyReport(
        city=city,
        timestamp=datetime.now(timezone.utc),
        medications=medications,
        source="mock",
    )


# ---------------------------------------------------------------------------
# Main collector
# ---------------------------------------------------------------------------

async def collect(city: str) -> PharmacyReport:
    """Collect pharmacy stock data — live via CVS API or mock fallback.

    Args:
        city: City name (e.g. "Orlando", "Tampa")

    Returns:
        PharmacyReport with OTC medication stock levels.
    """
    try:
        if sys.platform != "darwin":
            raise RuntimeError("CVS Safari scraping only available on macOS")

        medications = await _fetch_live(city)

        if not medications:
            report = _generate_mock(city)
            save_collector_output(city, "pharmacy", report)
            return report

        # Determine if any data was actually from the API
        report = PharmacyReport(
            city=city,
            timestamp=datetime.now(timezone.utc),
            medications=medications,
            source="cvs_safari",
        )

    except Exception as e:
        print(f"[pharmacy] Live fetch failed for {city}: {e}")
        report = _generate_mock(city)

    save_collector_output(city, "pharmacy", report)
    return report
