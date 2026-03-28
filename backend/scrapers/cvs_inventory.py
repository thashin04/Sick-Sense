#!/usr/bin/env python3
"""
CVS Store Inventory Checker

Uses Safari (via AppleScript) to bypass CVS's Incapsula protection.
Safari is the only browser that can load CVS product pages and call the
inventory API without being blocked.

FIRST-TIME SETUP:
  1. Open Safari → Settings → Advanced → check "Show Develop menu"
  2. Then: Develop menu → check "Allow JavaScript from Apple Events"

Usage:
  python3 cvs_inventory.py --product 733108 --store 1314
  python3 cvs_inventory.py --product 733108 --store 1314,2190,3045
"""

import argparse
import json
import subprocess
import tempfile
import time
import sys
import os


def run_applescript(script: str, timeout: int = 30) -> str:
    """Run an AppleScript and return the result."""
    result = subprocess.run(
        ["osascript", "-e", script],
        capture_output=True, text=True, timeout=timeout,
    )
    if result.returncode != 0:
        if "Allow JavaScript from Apple Events" in result.stderr:
            print("\n❌ Safari needs a one-time setting change:")
            print("   1. Open Safari → Settings → Advanced")
            print("      → check 'Show features for web developers'")
            print("   2. Then: Develop menu (in menu bar)")
            print("      → check 'Allow JavaScript from Apple Events'")
            print("   3. Re-run this script\n")
            sys.exit(1)
        raise RuntimeError(f"AppleScript error: {result.stderr.strip()}")
    return result.stdout.strip()


def run_js_in_safari(js_code: str) -> str:
    """Execute JavaScript in Safari's current tab using a temp file approach."""
    # Write JS to a temp file, then read and execute it via AppleScript
    with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
        f.write(js_code)
        js_path = f.name

    try:
        applescript = f'''
            set jsFile to POSIX file "{js_path}"
            set jsCode to read jsFile
            tell application "Safari"
                -- Target the front window (even if miniaturized)
                set jsResult to do JavaScript jsCode in current tab of front window
                return jsResult
            end tell
        '''
        return run_applescript(applescript, timeout=20)
    finally:
        os.unlink(js_path)


def check_inventory(product_id: str, store_id: str, product_url: str) -> dict | None:
    """Check inventory for a single product/store combo via Safari."""

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
            print(f"   ⚠️ Got 200 but couldn't parse: {body[:200]}")
    else:
        print(f"   ❌ Status {status_str}: {body[:200]}")

    return None


def open_product_page(product_url: str) -> str:
    """Open the product page in Safari and wait for it to load."""
    run_applescript(f'''
        tell application "Safari"
            -- Create a GUARANTEED new window (not a tab) to avoid mixing with Dev UI
            make new document with properties {{URL: "{product_url}"}}
            delay 1
            -- Move window off-screen to avoid disrupting the user
            set bounds of window 1 to {{2500, 2500, 3200, 3000}}
        end tell
    ''')

    print(f"   Loading product page in Safari...")
    time.sleep(10)

    title = run_applescript('''
        tell application "Safari"
            return name of current tab of front window
        end tell
    ''')
    return title


def main():
    parser = argparse.ArgumentParser(description="CVS Inventory Checker (via Safari)")
    parser.add_argument("--product", "-p", default="733108",
                        help="CVS product ID (the 'prodid' number from a CVS URL)")
    parser.add_argument("--store", "-s", default="1314",
                        help="CVS store number(s), comma-separated for multiple")
    parser.add_argument("--url", "-u", default=None,
                        help="Full CVS product URL (optional, overrides --product)")
    args = parser.parse_args()

    store_ids = [s.strip() for s in args.store.split(",")]
    product_url = args.url or f"https://www.cvs.com/shop/vicks-vapobreather-vapor-drops-cool-mint-40-ct-prodid-{args.product}"

    print(f"🔍 CVS Inventory Check")
    print(f"   Product  : {args.product}")
    print(f"   Store(s) : {', '.join(store_ids)}")
    print()

    # Open product page once
    title = open_product_page(product_url)
    if "Access Denied" in title:
        print(f"   ❌ Product page blocked: {title}")
        print("   Try opening the URL manually in Safari first, then re-run.")
        sys.exit(1)

    print(f"   ✅ {title[:60]}")

    all_results = []

    for i, store_id in enumerate(store_ids):
        print(f"\n📍 Store #{store_id} ({i+1}/{len(store_ids)})...")

        data = check_inventory(args.product, store_id, product_url)

        if data:
            resp = data.get("getATPInventoryResponse", {})
            if resp.get("responseStatus", {}).get("statusCd") == "00":
                for line in resp.get("promiseLines", {}).get("promiseLine", []):
                    pid = line.get("product", {}).get("productIdentifier", {}).get("identificationIdentifier", "?")
                    for inv in line.get("shipNodeAvailableInventory", {}).get("inventory", []):
                        snum = inv.get("shipNode", {}).get("partyIdentifier", {}).get("identificationIdentifier", "?")
                        avail = inv.get("availableOnHandQuantity", "0")
                        pick = inv.get("pickOnHandQuantity", "0")
                        store_qty = inv.get("storeOnHandQuantity", "0")
                        sdd = inv.get("sddOnHandQuantity", "0")

                        all_results.append({
                            "store": snum,
                            "available": avail,
                            "store_on_hand": store_qty,
                            "pick": pick,
                            "sdd": sdd,
                        })
                        print(f"   ✅ Available: {avail} | In-Store: {store_qty}")
            else:
                print(f"   ❌ API error: {resp.get('responseStatus')}")

        if i < len(store_ids) - 1:
            time.sleep(1)  # Brief delay between stores

    # Summary
    if all_results:
        print(f"\n{'=' * 55}")
        print(f"🏪  CVS INVENTORY — Product {args.product}")
        print(f"{'=' * 55}")
        print(f"  {'Store':>6}  {'Available':>10}  {'In-Store':>10}  {'Pickup':>7}  {'SDD':>5}")
        print(f"  {'─'*6}  {'─'*10}  {'─'*10}  {'─'*7}  {'─'*5}")
        for r in all_results:
            print(f"  {r['store']:>6}  {r['available']:>10}  {r['store_on_hand']:>10}  {r['pick']:>7}  {r['sdd']:>5}")
        print(f"{'=' * 55}")
    else:
        print("\n❌ No inventory data retrieved.")


if __name__ == "__main__":
    main()
