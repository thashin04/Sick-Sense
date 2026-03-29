import json
import subprocess
import tempfile
import os
import time

def run_applescript(script: str, timeout: int = 30) -> str:
    """Run an AppleScript and return the result."""
    result = subprocess.run(
        ["osascript", "-e", script],
        capture_output=True, text=True, timeout=timeout,
    )
    if result.returncode != 0:
        raise RuntimeError(f"AppleScript error: {result.stderr.strip()}")
    return result.stdout.strip()

def run_js_in_safari(js_code: str) -> str:
    """Execute JavaScript in Safari's current tab using a temp file approach."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
        f.write(js_code)
        js_path = f.name

    try:
        applescript = f'''
            set jsFile to POSIX file "{js_path}"
            set jsCode to read jsFile
            tell application "Safari"
                set jsResult to do JavaScript jsCode in current tab of front window
                return jsResult
            end tell
        '''
        return run_applescript(applescript, timeout=20)
    finally:
        os.unlink(js_path)

def _init_fl_blue_session():
    """Navigate Safari to the Florida Blue provider search to grab an organic Akamai cookie."""
    # We open a dedicated offscreen window to avoid disrupting the user
    # Or just use the current window if one is open. For background stability, a new window is safer.
    script = '''
    tell application "Safari"
        tell application "System Events" to set visible of process "Safari" to false
        make new document with properties {URL:"https://providersearch.floridablue.com/"}
        delay 2
        set bounds of front window to {2500, 2500, 3000, 3000}
    end tell
    '''
    run_applescript(script, timeout=15)
    time.sleep(3)  # Give Akamai 3 seconds to negotiate the TLS handshake and set the cookie natively

def fetch_florida_blue_internal(plan_code: str, zip_code: str, specialty: str) -> dict:
    """
    Executes the internal private POST request through Safari to bypass Akamai bot protection.
    Returns the JSON parsed result directly.
    """
    _init_fl_blue_session()
    
    # Generate the exact JSON payload the user found
    payload = json.dumps({
        "planCode": plan_code,
        "language": "EN",
        "start": 1,
        "end": 20,
        "isVCO": "N",
        "categoryCode": "01",
        "subCategoryCode": "93",
        "searchRange": "20",
        "appointment": False,
        "address": zip_code,
        "sortColumn": "",
        "sortType": "",
        "filterL1Providers": False,
        "acceptsMedicaid": "N",
        "filterPpnProviders": False,
        "conditionSpecialty": specialty,
        "transactionId": "d53ce908-9495-445b-b86c-d7f8459784ec",
        "sourceSystem": "web",
        "tenantId": "FloridaBlue",
        "applicationId": "OPD",
        "originLatitude": None,
        "originLongitude": None
    })
    
    # We use fetch to bypass Safari's synchronous blocking for POST requests.
    js_init = f'''
        document.body.setAttribute("data-fb-result", "PENDING");
        fetch("https://providersearch.floridablue.com/visitor/data/v1/providers/search", {{
            method: "POST",
            headers: {{"Content-Type": "application/json;charset=UTF-8", "Accept": "application/json, text/plain, */*"}},
            body: JSON.stringify({payload})
        }})
        .then(r => r.text())
        .then(t => document.body.setAttribute("data-fb-result", "200|||" + t))
        .catch(e => document.body.setAttribute("data-fb-result", "ERR|||" + e.message));
    '''
    run_js_in_safari(js_init)
    
    # Poll for result
    raw_result = "PENDING"
    for _ in range(15):
        time.sleep(0.5)
        res = run_js_in_safari('document.body.getAttribute("data-fb-result");')
        if res and res != "PENDING" and res != "null":
            raw_result = res
            break

    
    if not raw_result or "|||" not in raw_result:
        return {"error": "Failed to get a response from Safari.", "raw": raw_result}
        
    status_str, body = raw_result.split("|||", 1)
    
    # Clean up the hidden window (optional, but good for memory)
    run_applescript('tell application "Safari" to close current tab of front window')
    
    if status_str == "200":
        try:
            return json.loads(body)
        except json.JSONDecodeError:
            return {"error": "JSON parse error", "body": body[:200]}
    else:
        return {"error": f"HTTP {status_str}", "body": body[:500]}
