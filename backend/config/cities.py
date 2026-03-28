from dataclasses import dataclass

@dataclass(frozen=True)
class CityConfig:
    name: str
    lat: float
    lng: float
    subreddit: str
    trends_geo: str
    hospitals: list[str]
    nextdoor_slug: str = ""  # e.g. "orlando--fl" for nextdoor.com/city/orlando--fl/


FLORIDA_CITIES: dict[str, CityConfig] = {
    "tallahassee": CityConfig(
        name="Tallahassee",
        lat=30.4383,
        lng=-84.2807,
        subreddit="Tallahassee",
        trends_geo="US-FL-530",
        hospitals=["Tallahassee Memorial Hospital", "Capital Regional Medical Center"],
        nextdoor_slug="tallahassee--fl",
    ),
    "gainesville": CityConfig(
        name="Gainesville",
        lat=29.6516,
        lng=-82.3248,
        subreddit="GNV",
        trends_geo="US-FL-592",
        hospitals=["UF Health Shands Hospital", "North Florida Regional Medical Center"],
        nextdoor_slug="gainesville--fl",
    ),
    "jacksonville": CityConfig(
        name="Jacksonville",
        lat=30.3322,
        lng=-81.6557,
        subreddit="jacksonville",
        trends_geo="US-FL-561",
        hospitals=["Baptist Medical Center", "Mayo Clinic Jacksonville"],
        nextdoor_slug="jacksonville--fl",
    ),
    "tampa": CityConfig(
        name="Tampa",
        lat=27.9506,
        lng=-82.4572,
        subreddit="tampa",
        trends_geo="US-FL-539",
        hospitals=["Tampa General Hospital", "St. Joseph's Hospital"],
        nextdoor_slug="tampa--fl",
    ),
    "orlando": CityConfig(
        name="Orlando",
        lat=28.5383,
        lng=-81.3792,
        subreddit="orlando",
        trends_geo="US-FL-534",
        hospitals=["Orlando Regional Medical Center", "AdventHealth Orlando"],
        nextdoor_slug="orlando--fl",
    ),
    "miami": CityConfig(
        name="Miami",
        lat=25.7617,
        lng=-80.1918,
        subreddit="Miami",
        trends_geo="US-FL-528",
        hospitals=["Jackson Memorial Hospital", "Mercy Hospital"],
        nextdoor_slug="miami--fl",
    ),
    "fort_lauderdale": CityConfig(
        name="Fort Lauderdale",
        lat=26.1224,
        lng=-80.1373,
        subreddit="fortlauderdale",
        trends_geo="US-FL-528",
        hospitals=["Broward Health Medical Center", "Holy Cross Hospital"],
        nextdoor_slug="fort-lauderdale--fl",
    ),
}


def get_city(city_key: str) -> CityConfig:
    """Look up a city by key (case-insensitive, underscores/spaces tolerated)."""
    key = city_key.lower().replace(" ", "_").replace(".", "")
    if key in FLORIDA_CITIES:
        return FLORIDA_CITIES[key]

    for k, v in FLORIDA_CITIES.items():
        if v.name.lower() == city_key.lower():
            return v
    raise ValueError(f"Unknown city: {city_key}. Available: {list(FLORIDA_CITIES.keys())}")
