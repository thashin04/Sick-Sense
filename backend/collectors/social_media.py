import random
from datetime import datetime, timezone

import httpx

from backend.config.cities import get_city
from backend.config.schemas import SocialPost, SocialMediaReport
from backend.collectors.output_utils import save_collector_output


SICKNESS_KEYWORDS = [
    "flu", "cold", "sick", "fever", "cough", "covid",
    "sore throat", "congestion", "sneezing", "vomiting",
    "stomach bug", "nausea", "strep", "pneumonia",
    "urgent care", "ER wait", "doctor appointment",
]

HEADERS = {
    "User-Agent": "SickSense/1.0 (health outbreak detection research)",
}


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


async def collect(city: str) -> SocialMediaReport:
    try:
        city_cfg = get_city(city)
        query = " OR ".join(SICKNESS_KEYWORDS[:6])
        url = f"https://www.reddit.com/r/{city_cfg.subreddit}/search.json"

        async with httpx.AsyncClient(timeout=15, headers=HEADERS, follow_redirects=True) as client:
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
        keyword_counts: dict[str, int] = {}

        children = data.get("data", {}).get("children", [])
        for child in children:
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

            full_text = f"{title} {selftext}".lower()
            for kw in SICKNESS_KEYWORDS:
                if kw.lower() in full_text:
                    keyword_counts[kw] = keyword_counts.get(kw, 0) + 1

        report = SocialMediaReport(
            city=city,
            timestamp=datetime.now(timezone.utc),
            posts=posts,
            keyword_counts=keyword_counts,
            total_mentions=sum(keyword_counts.values()),
            source="reddit_scrape",
        )

    except Exception as e:
        print(f"[social_media] Reddit scrape error for {city}: {e} — falling back to mock")
        report = _mock_social_media(city)

    save_collector_output(city, "social_media", report)
    return report
