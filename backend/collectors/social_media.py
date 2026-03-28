"""
SickSense — Social media collector.

Fetches sickness-related posts from:
  - Reddit (city subreddit search)
  - Nextdoor (public city page, no auth required)
"""

import random
import re
from datetime import datetime, timezone

import httpx
from bs4 import BeautifulSoup

from backend.config.cities import get_city
from backend.config.schemas import SocialPost, SocialMediaReport
from backend.collectors.output_utils import save_collector_output


SICKNESS_KEYWORDS = [
    "flu", "cold", "sick", "fever", "cough", "covid",
    "sore throat", "congestion", "sneezing", "vomiting",
    "stomach bug", "nausea", "strep", "pneumonia",
    "urgent care", "ER wait", "doctor appointment",
]

REDDIT_HEADERS = {
    "User-Agent": "SickSense/1.0 (health outbreak detection research)",
}

NEXTDOOR_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml",
}


# ---------------------------------------------------------------------------
# Reddit fetcher
# ---------------------------------------------------------------------------

async def _fetch_reddit(city_cfg) -> list[SocialPost]:
    """Fetch sickness-related posts from a city's subreddit."""
    query = " OR ".join(SICKNESS_KEYWORDS[:6])
    url = f"https://www.reddit.com/r/{city_cfg.subreddit}/search.json"

    async with httpx.AsyncClient(timeout=15, headers=REDDIT_HEADERS, follow_redirects=True) as client:
        resp = await client.get(url, params={
            "q": query,
            "restrict_sr": "on",
            "sort": "new",
            "t": "week",
            "limit": 25,
        })
        resp.raise_for_status()
        data = resp.json()

    posts = []
    for child in data.get("data", {}).get("children", []):
        post_data = child.get("data", {})
        title = post_data.get("title", "")
        selftext = post_data.get("selftext", "")

        posts.append(SocialPost(
            platform="reddit",
            subreddit=city_cfg.subreddit,
            title=title,
            snippet=selftext[:200] if selftext else "",
            score=post_data.get("score", 0),
            created_utc=post_data.get("created_utc", 0),
        ))

    return posts


# ---------------------------------------------------------------------------
# Text cleaning
# ---------------------------------------------------------------------------

def _clean_text(text: str) -> str:
    """Replace common Unicode artifacts with ASCII equivalents."""
    replacements = {
        "\u00b7": " - ",   # middle dot (·) used as separator
        "\u2019": "'",      # right single quote (')
        "\u2018": "'",      # left single quote (')
        "\u201c": '"',      # left double quote (")
        "\u201d": '"',      # right double quote (")
        "\u2014": " - ",    # em dash (—)
        "\u2013": "-",      # en dash (–)
        "\u00a0": " ",      # non-breaking space
        "\u2026": "...",    # ellipsis (…)
        "\u200b": "",       # zero-width space
    }
    for char, replacement in replacements.items():
        text = text.replace(char, replacement)
    # Collapse multiple spaces
    text = re.sub(r"  +", " ", text)
    return text.strip()


# ---------------------------------------------------------------------------
# Nextdoor fetcher
# ---------------------------------------------------------------------------

async def _fetch_nextdoor(city_cfg) -> list[SocialPost]:
    """Scrape public Nextdoor city page for community posts."""
    if not city_cfg.nextdoor_slug:
        return []

    url = f"https://nextdoor.com/city/{city_cfg.nextdoor_slug}/"

    async with httpx.AsyncClient(timeout=15, headers=NEXTDOOR_HEADERS, follow_redirects=True) as client:
        resp = await client.get(url)
        resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")

    # Posts are inside <a> tags with href matching /p/
    post_links = soup.find_all("a", href=re.compile(r'/p/'))
    posts = []
    seen = set()

    for link in post_links:
        href = link.get("href", "")
        post_id_match = re.search(r'/p/([a-zA-Z0-9_-]+)', href)
        if not post_id_match:
            continue
        pid = post_id_match.group(1)
        if pid in seen:
            continue
        seen.add(pid)

        text = link.get_text(strip=True, separator=" ")
        if len(text) < 20:
            continue  # skip tiny nav links

        # Clean up Unicode artifacts from HTML
        text = _clean_text(text)

        posts.append(SocialPost(
            platform="nextdoor",
            subreddit="",
            title=text[:200],
            snippet=text[:300] if len(text) > 200 else "",
            score=0,
            created_utc=datetime.now(timezone.utc).timestamp(),
        ))

    return posts


# ---------------------------------------------------------------------------
# Mock fallback
# ---------------------------------------------------------------------------

def _mock_social_media(city: str) -> SocialMediaReport:
    """Generate mock social media data. (fallback)"""
    random.seed(sum(ord(c) for c in city.lower()) + int(datetime.now().timestamp() / 86400))

    city_cfg = get_city(city)
    posts = []
    keyword_counts: dict[str, int] = {}

    num_posts = random.randint(5, 15)
    sample_titles = [
        f"Anyone else dealing with this terrible {random.choice(['flu', 'cold', 'cough'])} in {city_cfg.name}?",
        f"PSA: Something is going around {city_cfg.name} — my whole family is sick",
        f"Urgent care wait times in {city_cfg.name} are insane right now",
        f"DayQuil sold out at every pharmacy near me in {city_cfg.name}",
        f"COVID or just a bad cold? {city_cfg.name} area",
        f"Stomach bug hitting {city_cfg.name} hard this week",
        f"Strep throat outbreak at my kid's school in {city_cfg.name}",
        f"ER was packed last night at {random.choice(city_cfg.hospitals)}",
        f"Is anyone else sneezing nonstop? {city_cfg.name} allergies are brutal",
        f"Fever and body aches — who else in {city_cfg.name}?",
        f"Doctor said they're seeing a TON of flu cases in {city_cfg.name}",
        f"Stay home if you're sick, {city_cfg.name}!",
        f"Recommendation for walk-in clinic in {city_cfg.name}?",
        f"My workplace has half the people out sick in {city_cfg.name}",
        f"Weird respiratory thing going around {city_cfg.name}",
    ]

    for i in range(num_posts):
        title = sample_titles[i % len(sample_titles)]
        posts.append(SocialPost(
            platform="reddit",
            subreddit=city_cfg.subreddit,
            title=title,
            snippet=title[:100],
            score=random.randint(1, 200),
            created_utc=datetime.now(timezone.utc).timestamp() - random.randint(0, 86400 * 3),
        ))
        for kw in SICKNESS_KEYWORDS:
            if kw.lower() in title.lower():
                keyword_counts[kw] = keyword_counts.get(kw, 0) + 1

    random.seed()

    return SocialMediaReport(
        city=city,
        timestamp=datetime.now(timezone.utc),
        posts=posts,
        keyword_counts=keyword_counts,
        total_mentions=sum(keyword_counts.values()),
        source="mock",
    )


# ---------------------------------------------------------------------------
# Main collector
# ---------------------------------------------------------------------------

async def collect(city: str) -> SocialMediaReport:
    """Collect social media posts from Reddit + Nextdoor for a city."""
    try:
        city_cfg = get_city(city)

        # Fetch from both sources concurrently
        reddit_posts = []
        nextdoor_posts = []

        try:
            reddit_posts = await _fetch_reddit(city_cfg)
        except Exception as e:
            print(f"[social_media] Reddit error for {city}: {e}")

        try:
            nextdoor_posts = await _fetch_nextdoor(city_cfg)
        except Exception as e:
            print(f"[social_media] Nextdoor error for {city}: {e}")

        all_posts = reddit_posts + nextdoor_posts

        if not all_posts:
            report = _mock_social_media(city)
            save_collector_output(city, "social_media", report)
            return report

        # Count health keywords across all posts
        keyword_counts: dict[str, int] = {}
        for post in all_posts:
            full_text = f"{post.title} {post.snippet}".lower()
            for kw in SICKNESS_KEYWORDS:
                if kw.lower() in full_text:
                    keyword_counts[kw] = keyword_counts.get(kw, 0) + 1

        # Determine source label
        has_reddit = len(reddit_posts) > 0
        has_nextdoor = len(nextdoor_posts) > 0
        if has_reddit and has_nextdoor:
            source = "reddit+nextdoor"
        elif has_nextdoor:
            source = "nextdoor"
        else:
            source = "reddit_scrape"

        report = SocialMediaReport(
            city=city,
            timestamp=datetime.now(timezone.utc),
            posts=all_posts,
            keyword_counts=keyword_counts,
            total_mentions=sum(keyword_counts.values()),
            source=source,
        )

    except Exception as e:
        print(f"[social_media] Error for {city}: {e} — falling back to mock")
        report = _mock_social_media(city)

    save_collector_output(city, "social_media", report)
    return report
