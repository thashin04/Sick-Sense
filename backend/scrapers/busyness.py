#!/usr/bin/env python3
"""
Google Maps Busyness Scraper

Uses Safari (via AppleScript) to load Google Maps and extract the live
"Popular times" / "How busy" data for a location — the same Safari
approach as cvs_inventory.py so it runs in an already-authenticated
Google session.

FIRST-TIME SETUP (same as CVS):
  1. Open Safari → Settings → Advanced → check "Show Develop menu"
  2. Then: Develop menu → check "Allow JavaScript from Apple Events"

Usage:
  python3 scrapers/busyness.py --query "CVS Pharmacy, Orlando, FL"
  python3 scrapers/busyness.py --query "Walgreens 5658 Orlando FL"
  python3 scrapers/busyness.py --query "CVS 1314 Orlando" --wait 12
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.parse


# ── Safari / AppleScript helpers (same pattern as cvs_inventory.py) ──────

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


def run_js_in_safari(js_code: str, timeout: int = 20) -> str:
    """Execute JavaScript in Safari's current tab using a temp file approach."""
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
        return run_applescript(applescript, timeout=timeout)
    finally:
        os.unlink(js_path)


# ── Core scraping logic ──────────────────────────────────────────────────

def open_maps_page(query: str, wait_seconds: int = 10) -> str:
    """Open Google Maps search in Safari and wait for it to load."""
    encoded = urllib.parse.quote(query)
    url = f"https://www.google.com/maps/search/{encoded}"

    run_applescript(f'''
        tell application "Safari"
            -- Create a GUARANTEED new window (not a tab) to avoid mixing with Dev UI
            make new document with properties {{URL: "{url}"}}
            delay 1
            -- Move window off-screen to avoid disrupting the user
            set bounds of window 1 to {{2500, 2500, 3200, 3000}}
        end tell
    ''')

    print(f"   Loading Google Maps in Safari...")
    time.sleep(wait_seconds)

    title = run_applescript('''
        tell application "Safari"
            return name of current tab of front window
        end tell
    ''')
    return title


def click_first_result(target_name: str = "") -> str:
    """
    Click the search result in Google Maps that best matches the target_name.
    Skips 'Sponsored' results.
    Returns the name of the place that was clicked, or empty string.
    """
    # Pass target_name to JS to help it pick the right result
    js = r'''
(function() {
    var target = "TARGET_NAME";
    var links = document.querySelectorAll('a.hfpxzc');
    
    // First pass: look for exact/partial match
    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        var name = link.getAttribute('aria-label') || '';
        
        if (target && name.toLowerCase().includes(target.split(',')[0])) {
            link.click();
            return name;
        }
    }
    
    // Second pass: click the first non-sponsored one by checking just its immediate card wrapper
    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        var name = link.getAttribute('aria-label') || '';
        
        // Find the specific list item wrapper
        var card = link.closest && link.closest('[role="article"]');
        if (!card) {
            // fallback traversal
            card = link.parentElement;
            if(card) card = card.parentElement;
        }
        
        if (card && card.innerText.includes('Sponsored')) continue;
        
        link.click();
        return name;
    }
    
    // Fallback: try clicking any result link in the feed panel
    var feedItems = document.querySelectorAll('[role="feed"] a[href*="/maps/place/"]');
    for (var i = 0; i < feedItems.length; i++) {
        var item = feedItems[i];
        var card = item.closest && item.closest('[role="article"]');
        if (!card) {
            card = item.parentElement;
            if(card) card = card.parentElement;
        }
        if (card && card.innerText.includes('Sponsored')) continue;
        
        var name2 = item.getAttribute('aria-label') || item.innerText || '';
        item.click();
        return name2;
    }

    // Another fallback: maybe we're already on a place page (single result)
    var h1 = document.querySelector('h1.fontHeadlineLarge, h1.DUwDvf');
    if (h1) {
        return 'ALREADY_ON_PLACE:' + h1.innerText;
    }

    return '';
})()
'''.replace('TARGET_NAME', target_name.replace('"', '\\"').lower())

    return run_js_in_safari(js, timeout=10)


def scroll_detail_panel():
    """
    Scroll the place detail panel down so that the Popular Times section
    (which is lazy-loaded / below the fold) becomes visible in the DOM.
    """
    js = r'''
(function() {
    // The scrollable detail panel is typically a div with role="main"
    // or a specific scrollable container
    var panels = document.querySelectorAll(
        'div[role="main"], div.m6QErb.DxyBCb, div.m6QErb'
    );
    var scrolled = false;
    for (var i = 0; i < panels.length; i++) {
        var p = panels[i];
        if (p.scrollHeight > p.clientHeight) {
            // Scroll down in steps to trigger lazy loading
            p.scrollTop = 300;
            scrolled = true;
            break;
        }
    }
    if (!scrolled) {
        // Fallback: scroll the whole page
        window.scrollBy(0, 400);
    }
    return 'scrolled';
})()
'''
    run_js_in_safari(js, timeout=10)
    time.sleep(2)

    # Scroll a bit more
    js2 = r'''
(function() {
    var panels = document.querySelectorAll(
        'div[role="main"], div.m6QErb.DxyBCb, div.m6QErb'
    );
    for (var i = 0; i < panels.length; i++) {
        var p = panels[i];
        if (p.scrollHeight > p.clientHeight) {
            p.scrollTop = 600;
            return 'scrolled_more';
        }
    }
    return 'no_panel';
})()
'''
    run_js_in_safari(js2, timeout=10)
    time.sleep(2)

def scrape_busyness() -> dict:
    """
    Scrape the live busyness data from the place detail panel on Google Maps.

    Google Maps renders popular-times as bars with aria-labels like:
      "Currently 45% busy, usually 30% busy."
      "70% busy at 4 PM. Usually 60% busy."
      "10% busy at 6 AM."
    """

    js = r'''
(function() {
    var result = {
        live_busyness_pct: null,
        live_busyness_text: null,
        usual_busyness_pct: null,
        popular_times: [],
        place_name: null,
        error: null
    };

    try {
        // Get the place name from the heading
        var heading = document.querySelector('h1.fontHeadlineLarge') ||
                      document.querySelector('h1.DUwDvf') ||
                      document.querySelector('h1');
        if (heading) {
            result.place_name = heading.innerText.trim();
        }

        // --- Scan all aria-labels for busyness data ---
        // This is the most reliable approach: Google puts descriptive
        // aria-labels on the popular-times bars.
        var allEls = document.querySelectorAll('[aria-label]');
        for (var j = 0; j < allEls.length; j++) {
            var label = allEls[j].getAttribute('aria-label') || '';

            // Live busyness: "Currently 45% busy, usually 30% busy."
            var liveMatch = label.match(/[Cc]urrently\s+(\d+)%\s+busy/);
            if (liveMatch) {
                result.live_busyness_pct = parseInt(liveMatch[1]);
            }
            var usualMatch = label.match(/[Uu]sually\s+(\d+)%\s+busy/);
            if (usualMatch && !label.match(/at\s+\d+/)) {
                // "usually X% busy" without "at <time>" = the current-hour usual
                result.usual_busyness_pct = parseInt(usualMatch[1]);
            }

            // Histogram bars: "45% busy at 3 PM." or "70% busy at 4 PM. Usually 60% busy."
            var histMatch = label.match(/(\d+)%\s+busy\s+at\s+([\d]+\s*[APap][Mm])/);
            if (histMatch) {
                var entry = {
                    pct: parseInt(histMatch[1]),
                    time: histMatch[2].replace(/\s+/g, ' ').trim()
                };
                // Check if there's also a "Usually X% busy" in the same label
                var usualInBar = label.match(/[Uu]sually\s+(\d+)%\s+busy/);
                if (usualInBar) {
                    entry.usual_pct = parseInt(usualInBar[1]);
                }
                result.popular_times.push(entry);
            }
        }

        // --- Live busyness text badge ---
        // Google shows text like "Not too busy", "Less busy than usual",
        // "A little busy", "As busy as it gets", etc.
        // Walk through all spans/divs and look for busyness keywords
        var textCandidates = document.querySelectorAll(
            'span, div.OqCZI, div.g2BVhd, div.dpoVKd'
        );
        for (var k = 0; k < textCandidates.length; k++) {
            var el = textCandidates[k];
            var txt = el.innerText ? el.innerText.trim() : '';
            // Must contain "busy" and be reasonably short (not a paragraph)
            if (txt && txt.length < 80 &&
                txt.toLowerCase().includes('busy') &&
                !txt.includes('\n')) {
                // Prefer text that says "than usual" or "not too" — these are
                // the live status badges
                if (txt.toLowerCase().includes('usual') ||
                    txt.toLowerCase().includes('not too') ||
                    txt.toLowerCase().includes('little') ||
                    txt.toLowerCase().includes('as busy as')) {
                    result.live_busyness_text = txt;
                    break;
                }
                // Store as fallback if we haven't found a better one
                if (!result.live_busyness_text) {
                    result.live_busyness_text = txt;
                }
            }
        }

    } catch(e) {
        result.error = e.message;
    }

    return JSON.stringify(result);
})()
'''

    raw = run_js_in_safari(js, timeout=15)

    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return {"error": f"Failed to parse response: {raw[:300]}"}


def main():
    parser = argparse.ArgumentParser(
        description="Google Maps Busyness Scraper (via Safari)"
    )
    parser.add_argument(
        "--query", "-q", required=True,
        help="Search query for Google Maps (e.g. 'CVS Pharmacy, Orlando, FL')"
    )
    parser.add_argument(
        "--wait", "-w", type=int, default=10,
        help="Seconds to wait for Maps page to load (default: 10)"
    )
    args = parser.parse_args()

    print(f"🗺️  Google Maps Busyness Check")
    print(f"   Query: {args.query}")
    print()

    # Step 1: Open the Maps search page
    title = open_maps_page(args.query, wait_seconds=args.wait)
    print(f"   ✅ Page loaded: {title[:60]}")

    # Step 2: Click the first search result to open place detail
    print(f"\n📌 Clicking first result to open place detail...")
    place_name = click_first_result()

    if place_name.startswith("ALREADY_ON_PLACE:"):
        print(f"   ✅ Already on place: {place_name[17:]}")
    elif place_name:
        print(f"   ✅ Clicked: {place_name[:60]}")
    else:
        print(f"   ⚠️  Could not find a result to click.")
        print(f"       Try a more specific query (include full address).")

    # Step 3: Wait for the detail panel to load
    print(f"   Waiting for place detail to load...")
    time.sleep(5)

    # Step 4: Scroll the detail panel to trigger lazy-load of Popular Times
    print(f"\n📜 Scrolling detail panel to reveal Popular Times...")
    scroll_detail_panel()

    # Step 5: Scrape the busyness data
    print(f"\n📊 Scraping busyness data...")
    data = scrape_busyness()

    if data.get("error"):
        print(f"   ❌ Error: {data['error']}")
        sys.exit(1)

    # Display results
    place = data.get("place_name") or place_name or args.query
    live_pct = data.get("live_busyness_pct")
    live_text = data.get("live_busyness_text")
    usual_pct = data.get("usual_busyness_pct")
    popular = data.get("popular_times", [])

    print(f"\n{'=' * 55}")
    print(f"📍  {place}")
    print(f"{'=' * 55}")

    if live_pct is not None:
        bar = "█" * (live_pct // 5) + "░" * (20 - live_pct // 5)
        print(f"  🔴 Live:   {live_pct}%  [{bar}]")
    if live_text:
        print(f"  💬 Status: {live_text}")
    if usual_pct is not None:
        bar = "█" * (usual_pct // 5) + "░" * (20 - usual_pct // 5)
        print(f"  📈 Usual:  {usual_pct}%  [{bar}]")

    if not live_pct and not live_text:
        print(f"  ⚠️  No live busyness data found.")
        print(f"     (Location may be closed or Google doesn't track it)")

    if popular:
        print(f"\n  ⏰ Popular Times Today:")
        for entry in popular:
            mini_bar = "█" * (entry["pct"] // 10)
            usual_str = f"  (usually {entry['usual_pct']}%)" if entry.get("usual_pct") else ""
            print(f"     {entry['time']:>6}  {entry['pct']:>3}%  {mini_bar}{usual_str}")

    print(f"{'=' * 55}")

    # Output as JSON for programmatic use
    print(f"\n📋 Raw JSON:")
    print(json.dumps(data, indent=2))


if __name__ == "__main__":
    main()
