"""
SickSense — 911 EMS dispatch collector.

Fetches live active-call data from public feeds for 5 Florida cities:
  - Orlando:        City CAD XML feed
  - Tampa:          City CAD JSON feed
  - Miami:          Miami-Dade Fire Rescue HTML table
  - Gainesville:    PulsePoint API (AES-encrypted)
  - Fort Lauderdale: PulsePoint API (AES-encrypted)
  - Jacksonville/Tallahassee: Mock fallback (no public feeds)
"""

from __future__ import annotations

import base64
import hashlib
import json
import random
import re
import xml.etree.ElementTree as ET
from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
from bs4 import BeautifulSoup
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

from backend.config.schemas import ActiveEMSCall, EMSCall, EMSReport
from backend.collectors.output_utils import save_collector_output


# ---------------------------------------------------------------------------
# Feed configuration
# ---------------------------------------------------------------------------

FEED_CONFIG = {
    "orlando": {
        "type": "orlando_xml",
        "url": "https://www1.cityoforlando.net/opd/activecalls/activecadfire.xml",
        "source": "orlando_cad",
        "snapshot": True,   # only shows currently-active calls
    },
    "tampa": {
        "type": "tampa_json",
        "url": "https://ncapps.tampagov.net/callsforservice/TFR/Json",
        "source": "tampa_cad",
        "snapshot": False,  # rolling log
    },
    "miami": {
        "type": "miami_html",
        "url": "https://www.miamidade.gov/firecalls/calls.html",
        "source": "miami_cad",
        "snapshot": True,   # only shows currently-active calls
    },
    "gainesville": {
        "type": "pulsepoint",
        "agency_id": "EMS1296",
        "source": "pulsepoint",
        "snapshot": False,  # active + 100 recent
    },
    "fort_lauderdale": {
        "type": "pulsepoint",
        "agency_id": "10192",
        "source": "pulsepoint",
        "snapshot": False,  # active + 100 recent
    },
}

# Typical daily call counts per health category (for comparison)
CALL_TYPES = [
    {"call_type": "respiratory_distress", "typical_daily": 12},
    {"call_type": "fever_chills", "typical_daily": 8},
    {"call_type": "nausea_vomiting", "typical_daily": 6},
    {"call_type": "chest_pain", "typical_daily": 15},
    {"call_type": "difficulty_breathing", "typical_daily": 10},
    {"call_type": "allergic_reaction", "typical_daily": 4},
    {"call_type": "pediatric_fever", "typical_daily": 5},
    {"call_type": "general_illness", "typical_daily": 18},
]

# ---------------------------------------------------------------------------
# Call-type classification
# ---------------------------------------------------------------------------

# Map raw call descriptions → health categories
HEALTH_CATEGORIES = {
    "general_illness": [
        "medical", "medical emergency", "me", "medical (assumed)",
        "sick person", "ill person", "general illness",
    ],
    "respiratory_distress": [
        "breathing", "respiratory", "choking", "asthma",
        "difficulty breathing", "shortness of breath",
    ],
    "chest_pain": [
        "chest pain", "cardiac", "heart",
    ],
    "allergic_reaction": [
        "allergic", "allergy", "anaphylaxis",
    ],
}

# These call types are NOT health-relevant and should be skipped
SKIP_TYPES = {
    "fire", "building fire", "automatic fire alarm", "fa", "fire alarm",
    "traffic accident", "traffic collision", "tc", "tce", "vehicle fire",
    "hazardous", "elevator", "public assist", "trash", "dumpster",
    "transformer", "fire out", "red alert", "oa", "ift",
}


def classify_call(description: str) -> Optional[str]:
    """Classify a raw call description into a health category, or None if irrelevant."""
    desc_lower = description.lower().strip()

    # Skip non-health calls
    for skip in SKIP_TYPES:
        if skip in desc_lower:
            return None

    # Match to health categories
    for category, keywords in HEALTH_CATEGORIES.items():
        for kw in keywords:
            if kw in desc_lower:
                return category

    # If it's a short code we don't recognize, default to general_illness
    # since most EMS calls are medical
    if desc_lower in {"me", "medical"}:
        return "general_illness"

    return None


# ---------------------------------------------------------------------------
# PulsePoint decryption
# ---------------------------------------------------------------------------

_PP_E = "CommonIncidents"
_PP_PASSWORD = _PP_E[13] + _PP_E[1] + _PP_E[2] + "brady" + "5" + "r" + _PP_E.lower()[6] + _PP_E[5] + "gs"

PP_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Referer": "https://web.pulsepoint.org/",
    "Origin": "https://web.pulsepoint.org",
}


def _pp_derive_key(password: str, salt: bytes) -> tuple[bytes, bytes]:
    """OpenSSL EVP_BytesToKey: iterative MD5 for AES-256-CBC."""
    key_iv = b""
    prev = b""
    while len(key_iv) < 48:
        prev = hashlib.md5(prev + password.encode() + salt).digest()
        key_iv += prev
    return key_iv[:32], key_iv[32:48]


def _pp_decrypt(encrypted: dict) -> dict:
    """Decrypt a PulsePoint AES-encrypted {ct, iv, s} response."""
    ct = base64.b64decode(encrypted["ct"])
    salt = bytes.fromhex(encrypted["s"])
    key, iv = _pp_derive_key(_PP_PASSWORD, salt)
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()
    plaintext = decryptor.update(ct) + decryptor.finalize()
    pad_len = plaintext[-1]
    if 0 < pad_len <= 16:
        plaintext = plaintext[:-pad_len]
    result = json.loads(plaintext.decode("utf-8"))
    if isinstance(result, str):
        result = json.loads(result)
    return result


# ---------------------------------------------------------------------------
# Fetchers — one per feed type
# ---------------------------------------------------------------------------

async def _fetch_orlando(url: str) -> list[ActiveEMSCall]:
    """Fetch Orlando's XML CAD feed."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url)
        resp.raise_for_status()

    root = ET.fromstring(resp.text)
    calls = []
    for call_elem in root.iter("CALL"):
        desc = call_elem.findtext("DESC", "").strip()
        calls.append(ActiveEMSCall(
            incident_id=call_elem.findtext("INCIDENT", ""),
            timestamp=call_elem.findtext("DATE", ""),
            description=desc,
            location=call_elem.findtext("LOCATION", ""),
            agency="Orlando Fire",
        ))
    return calls


async def _fetch_tampa(url: str) -> list[ActiveEMSCall]:
    """Fetch Tampa's JSON CAD feed."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url)
        resp.raise_for_status()

    data = resp.json()
    calls = []
    for item in data:
        calls.append(ActiveEMSCall(
            incident_id=item.get("Incident", ""),
            timestamp=item.get("Dispatched", ""),
            description=item.get("Description", ""),
            location=f"Grid {item.get('Grid', '?')}",
            agency="Tampa Fire Rescue",
        ))
    return calls


async def _fetch_miami(url: str) -> list[ActiveEMSCall]:
    """Scrape Miami-Dade Fire Rescue HTML active calls table."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url)
        resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    calls = []

    # Find the calls table
    table = soup.find("table")
    if not table:
        return calls

    rows = table.find_all("tr")
    for row in rows[1:]:  # skip header row
        cols = row.find_all("td")
        if len(cols) >= 4:
            calls.append(ActiveEMSCall(
                incident_id="",
                timestamp=cols[0].get_text(strip=True),  # RCVD
                description=cols[2].get_text(strip=True),  # INC TYPE
                location=cols[3].get_text(strip=True),     # ADDRESS
                agency="Miami-Dade Fire Rescue",
            ))
    return calls


async def _fetch_pulsepoint(agency_id: str) -> list[ActiveEMSCall]:
    """Fetch and decrypt PulsePoint active incidents."""
    url = f"https://api.pulsepoint.org/v1/webapp?resource=incidents&agencyid={agency_id}"

    async with httpx.AsyncClient(timeout=15, headers=PP_HEADERS) as client:
        resp = await client.get(url)
        resp.raise_for_status()

    data = _pp_decrypt(resp.json())

    calls = []
    incidents = data.get("incidents", {})
    active_list = incidents.get("active", [])
    recent_list = incidents.get("recent", [])

    for inc in active_list + recent_list:
        calls.append(ActiveEMSCall(
            incident_id=inc.get("ID", ""),
            timestamp=inc.get("CallReceivedDateTime", ""),
            description=inc.get("PulsePointIncidentCallType", ""),
            location=inc.get("FullDisplayAddress", ""),
            agency=inc.get("AgencyID", agency_id),
        ))
    return calls


# ---------------------------------------------------------------------------
# 24-hour filter
# ---------------------------------------------------------------------------

_TS_FORMATS = [
    "%Y-%m-%dT%H:%M:%SZ",
    "%Y-%m-%dT%H:%M:%S",
    "%m/%d/%Y %I:%M:%S %p",
    "%m/%d/%Y %H:%M:%S",
    "%m/%d/%Y %I:%M %p",
    "%m/%d/%Y %H:%M",
]


def _parse_ts(ts_str: str) -> Optional[datetime]:
    """Try to parse a timestamp string into a timezone-aware UTC datetime."""
    ts_str = ts_str.strip()
    if not ts_str:
        return None
    for fmt in _TS_FORMATS:
        try:
            dt = datetime.strptime(ts_str, fmt)
            return dt.replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


def _filter_recent(calls: list[ActiveEMSCall], hours: int = 24) -> list[ActiveEMSCall]:
    """Keep only calls from the last N hours."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    filtered = []
    for call in calls:
        dt = _parse_ts(call.timestamp)
        if dt is None:
            # Can't parse timestamp — keep it (assume it's current)
            filtered.append(call)
        elif dt >= cutoff:
            filtered.append(call)
    return filtered


# ---------------------------------------------------------------------------
# Main collector
# ---------------------------------------------------------------------------

async def _fetch_live(city: str) -> tuple[list[ActiveEMSCall], str, bool]:
    """Fetch live calls for a city. Returns (calls, source, is_snapshot)."""
    config = FEED_CONFIG.get(city.lower())
    if not config:
        return [], "mock", False

    feed_type = config["type"]
    source = config["source"]
    is_snapshot = config.get("snapshot", False)

    if feed_type == "orlando_xml":
        calls = await _fetch_orlando(config["url"])
    elif feed_type == "tampa_json":
        calls = await _fetch_tampa(config["url"])
    elif feed_type == "miami_html":
        calls = await _fetch_miami(config["url"])
    elif feed_type == "pulsepoint":
        calls = await _fetch_pulsepoint(config["agency_id"])
    else:
        return [], "mock", False

    # Only keep calls from the last 24 hours
    calls = _filter_recent(calls)

    return calls, source, is_snapshot


def _categorize_calls(active_calls: list[ActiveEMSCall], is_snapshot: bool = False) -> list[EMSCall]:
    """Categorize raw calls into health-relevant types with counts.
    
    For snapshot feeds (only show currently-active calls), typical_count
    is scaled to an hourly rate so comparisons are apples-to-apples.
    """
    category_counts: Counter = Counter()

    for call in active_calls:
        category = classify_call(call.description)
        if category:
            category_counts[category] += 1

    # Build EMSCall list, ensuring all known categories are present
    typical_map = {ct["call_type"]: ct["typical_daily"] for ct in CALL_TYPES}
    ems_calls = []
    for call_type, daily_typical in typical_map.items():
        count = category_counts.get(call_type, 0)
        # For snapshot feeds, scale typical to hourly expectation
        typical = max(1, daily_typical // 24) if is_snapshot else daily_typical
        ems_calls.append(EMSCall(
            call_type=call_type,
            count=count,
            typical_count=typical,
        ))

    return ems_calls


def _generate_mock(city: str) -> EMSReport:
    """Generate mock EMS data for cities without live feeds."""
    seed_modifier = sum(ord(c) for c in city.lower())
    random.seed(int(datetime.now().timestamp() / 3600) + seed_modifier)

    calls = []
    total_health = 0
    for ct in CALL_TYPES:
        typical = ct["typical_daily"]
        count = max(0, typical + random.randint(-3, 5))
        calls.append(EMSCall(
            call_type=ct["call_type"],
            count=count,
            typical_count=typical,
        ))
        total_health += count

    random.seed()

    return EMSReport(
        city=city,
        timestamp=datetime.now(timezone.utc),
        calls=calls,
        active_calls=[],
        total_health_calls=total_health,
        source="mock",
    )


async def collect(city: str) -> EMSReport:
    """Collect EMS dispatch data for a city — live or mock.

    Args:
        city: City name (e.g. "Orlando", "Tampa", "Gainesville")

    Returns:
        EMSReport with categorized call counts and raw active calls.
    """
    try:
        active_calls, source, is_snapshot = await _fetch_live(city)

        if not active_calls:
            # No live feed or empty response — fall back to mock
            report = _generate_mock(city)
            save_collector_output(city, "ems_dispatch", report)
            return report

        # Categorize into health-relevant types
        ems_calls = _categorize_calls(active_calls, is_snapshot=is_snapshot)
        total = sum(c.count for c in ems_calls)

        report = EMSReport(
            city=city,
            timestamp=datetime.now(timezone.utc),
            calls=ems_calls,
            active_calls=active_calls,
            total_health_calls=total,
            source=source,
        )

    except Exception as e:
        # On any error, fall back to mock
        print(f"[ems_dispatch] Live fetch failed for {city}: {e}")
        report = _generate_mock(city)

    save_collector_output(city, "ems_dispatch", report)
    return report
