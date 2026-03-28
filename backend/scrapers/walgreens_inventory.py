# can hopefully update this in a bit... putting off til later


import asyncio
from playwright.async_api import async_playwright
import json

async def check_walgreens_inventory(
    sku_id: str = "sku6165069",
    ds_sku_id: str = "497286",
    gtin: str = "323900038134",
    store_num: str = "5658",
    state: str = "FL",
    zip_code: str = "32806",
    quantity: int = 12
):
    """
    Walgreens Pickup Inventory Checker

    Strategy: Open a real browser, navigate to Walgreens to build up
    all Akamai cookies/tokens, then use the browser's own fetch() to call
    the cart API from within the page context. This guarantees all cookies
    and XSRF tokens are correctly attached.

    The flow from the user's original network capture:
    1. POST to /cartsvc/v4/items to add an item to cart
    2. GET  /cartsvc/v1/items/(count) to read back inventory data
    
    Requirements:
        pip install playwright
        playwright install chromium
    """
    print(f"🔍 Walgreens Pickup Inventory Check")
    print(f"   SKU: {sku_id}  |  Store: #{store_num}  |  Zip: {zip_code}")
    print(f"   Quantity to check: {quantity}\n")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(viewport={"width": 1280, "height": 720})
        page = await context.new_page()
        await page.add_init_script(script="Object.defineProperty(navigator, 'webdriver', {get: () => undefined});")

        # ── Step 1: Navigate to build up session cookies ──
        print("1️⃣  Building session (navigating to Walgreens)...")
        await page.goto("https://www.walgreens.com/", wait_until="commit")
        await page.wait_for_timeout(5000)
        
        # Set the store cookie so Walgreens knows which store to check
        await page.evaluate('''(storeNum) => {
            document.cookie = "ps=" + storeNum + "; path=/; domain=.walgreens.com";
            document.cookie = "str_nbr_do=" + storeNum + "; path=/; domain=.walgreens.com";
        }''', store_num)
        
        # Navigate to a search page to look more natural and load more cookies
        print("   Navigating to search results page...")
        await page.goto("https://www.walgreens.com/search/results.jsp?Ntt=dayquil", wait_until="domcontentloaded")
        await page.wait_for_timeout(5000)

        # ── Step 2: Get the XSRF token from cookies ──  
        cookies = await context.cookies()
        xsrf = next((c['value'] for c in cookies if c['name'] == 'XSRF-TOKEN'), '')
        wag_sid = next((c['value'] for c in cookies if c['name'] == 'wag_sid'), '')
        uts_val = next((c['value'] for c in cookies if c['name'] == 'uts'), str(int(asyncio.get_event_loop().time() * 1000)))
        print(f"   XSRF: {xsrf[:30]}..." if xsrf else "   ⚠️ No XSRF token!")
        print(f"   Session: {wag_sid[:20]}..." if wag_sid else "")

        # ── Step 3: Add item to cart via in-page fetch() ──
        # Build payload as a Python dict, then serialize to JSON string
        payload = {
            "clientId": "SEARCH",
            "requestId": uts_val,
            "products": [{
                "quantity": quantity,
                "deliveryOption": "pickup",
                "skuId": sku_id,
                "dsSkuId": ds_sku_id,
                "gtin": gtin,
                "type": "DC"
            }],
            "pickupStoreInfo": {
                "storeNum": store_num,
                "bagEligibleIndicator": 0,
                "state": state,
                "zip": zip_code,
                "feeEligible": "N"
            }
        }
        payload_json = json.dumps(payload)
        
        print(f"\n2️⃣  Adding item to cart via in-page fetch()...")
        
        post_result = await page.evaluate('''async ([payloadStr, xsrfToken]) => {
            try {
                const resp = await fetch("https://www.walgreens.com/cartsvc/v4/items", {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                        "Accept": "application/json, text/plain, */*",
                        "X-XSRF-TOKEN": xsrfToken
                    },
                    body: payloadStr
                });
                const text = await resp.text();
                return { status: resp.status, body: text.substring(0, 500) };
            } catch(e) {
                return { status: -1, body: e.message };
            }
        }''', [payload_json, xsrf])
        
        print(f"   POST Status: {post_result['status']}")
        if post_result['status'] != 200:
            print(f"   Response: {post_result['body'][:200]}")

        # ── Step 4: Read cart details ──
        print(f"\n3️⃣  Reading cart details...")
        get_result = await page.evaluate('''async (xsrfToken) => {
            try {
                const resp = await fetch("https://www.walgreens.com/cartsvc/v1/items/(count)", {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Accept": "application/json, text/plain, */*",
                        "X-XSRF-TOKEN": xsrfToken
                    }
                });
                const data = await resp.json();
                return { status: resp.status, data: data };
            } catch(e) {
                return { status: -1, data: e.message };
            }
        }''', xsrf)
        
        print(f"   GET Status: {get_result['status']}")

        # ── Step 5: Extract and display inventory ──
        if get_result['status'] == 200 and isinstance(get_result.get('data'), dict):
            cart_data = get_result['data']
            items_info = cart_data.get('itemsInfo')
            
            if items_info:
                print("\n" + "=" * 55)
                print("🛒  WALGREENS PICKUP INVENTORY RESULTS")
                print("=" * 55)
                for item in items_info:
                    product_id = item.get("productId", "?")
                    sku = item.get("skuId", "?")
                    inv = item.get("inventory", {})
                    print(f"\n  Product: {product_id}  (SKU: {sku})")
                    print(f"  ┌─────────────────────────────────────────┐")
                    print(f"  │ Available Pickup Inventory:  {str(inv.get('availablePickupInventory', 'N/A')):>8}  │")
                    print(f"  │ Available Ship Inventory:    {str(inv.get('availableShipInventory', 'N/A')):>8}  │")
                    print(f"  │ Purchase Limit (online):     {str(inv.get('purchaseLimitQty', 'N/A')):>8}  │")
                    print(f"  │ Store Purchase Limit:        {str(inv.get('storePurLimit', 'N/A')):>8}  │")
                    print(f"  │ Partial Qty:                 {str(inv.get('partialQty', 'N/A')):>8}  │")
                    print(f"  └─────────────────────────────────────────┘")
                print("=" * 55)
            else:
                print(f"\n   Cart response (empty): {json.dumps(cart_data)[:300]}")
        else:
            print(f"\n   ❌ Failed to get cart data")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(check_walgreens_inventory())
