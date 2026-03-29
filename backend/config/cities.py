from dataclasses import dataclass, field


@dataclass(frozen=True)
class CityConfig:
    name: str
    lat: float
    lng: float
    subreddit: str
    trends_geo: str
    hospitals: list[str]
    nextdoor_slug: str = ""  # e.g. "orlando--fl" for nextdoor.com/city/orlando--fl/
    cvs_store_ids: list[str] = field(default_factory=list)  # CVS store numbers for inventory checks


FLORIDA_CITIES: dict[str, CityConfig] = {
    "tallahassee": CityConfig(
        name="Tallahassee",
        lat=30.4383,
        lng=-84.2807,
        subreddit="Tallahassee",
        trends_geo="US-FL-530",
        hospitals=["Patients First - Tennessee Street", "Tallahassee Memorial Urgent Care Center on Medical Drive"],
        nextdoor_slug="tallahassee--fl",
        cvs_store_ids=["2927"],
    ),
    "gainesville": CityConfig(
        name="Gainesville",
        lat=29.6516,
        lng=-82.3248,
        subreddit="GNV",
        trends_geo="US-FL-592",
        hospitals=["UF Health Urgent Care Center - Eastside", "CareSpot Urgent Care of Gainesville 43rd Street"],
        nextdoor_slug="gainesville--fl",
        cvs_store_ids=["2240"],
    ),
    "jacksonville": CityConfig(
        name="Jacksonville",
        lat=30.3322,
        lng=-81.6557,
        subreddit="jacksonville",
        trends_geo="US-FL-561",
        hospitals=["CareSpot Urgent Care of Jacksonville Westside", "CareSpot Urgent Care of Jacksonville Southside"],
        nextdoor_slug="jacksonville--fl",
        cvs_store_ids=["2163"],
    ),
    "tampa": CityConfig(
        name="Tampa",
        lat=27.9506,
        lng=-82.4572,
        subreddit="tampa",
        trends_geo="US-FL-539",
        hospitals=["TGH Urgent Care powered by Fast Track (Brandon)", "MD Now Urgent Care - South Tampa"],
        nextdoor_slug="tampa--fl",
        cvs_store_ids=["2190"],
    ),
    "orlando": CityConfig(
        name="Orlando",
        lat=28.5383,
        lng=-81.3792,
        subreddit="orlando",
        trends_geo="US-FL-534",
        hospitals=["AdventHealth Primary Care+ Waterford Lakes", "AdventHealth Centra Care Winter Park"],
        nextdoor_slug="orlando--fl",
        cvs_store_ids=["1314"],
    ),
    "miami": CityConfig(
        name="Miami",
        lat=25.7617,
        lng=-80.1918,
        subreddit="Miami",
        trends_geo="US-FL-528",
        hospitals=["UHealth Jackson Urgent Care | Country Walk", "MD Now Urgent Care - Miami Lakes, Hialeah"],
        nextdoor_slug="miami--fl",
        cvs_store_ids=["3045"],
    ),
    "fort_lauderdale": CityConfig(
        name="Fort Lauderdale",
        lat=26.1224,
        lng=-80.1373,
        subreddit="fortlauderdale",
        trends_geo="US-FL-528",
        hospitals=["MD Now Urgent Care - Fort Lauderdale", "Baptist Health Urgent Care | Weston"],
        nextdoor_slug="fort-lauderdale--fl",
        cvs_store_ids=["2804"],
    ),
}


def get_city(city_key: str) -> CityConfig:
    """Look up a city by key (case-insensitive, underscores/spaces/common suffixes tolerated)."""
    # Clean up common suffixes like ", Florida" or ", FL"
    clean_key = city_key.split(',')[0].strip()
    
    # Use case-insensitive check for suffixes
    if clean_key.lower().endswith(" florida"):
        clean_key = clean_key[:-8].strip()
    elif clean_key.lower().endswith(" fl"):
        clean_key = clean_key[:-3].strip()
    
    key = clean_key.lower().replace(" ", "_").replace(".", "")
    if key in FLORIDA_CITIES:
        return FLORIDA_CITIES[key]

    for k, v in FLORIDA_CITIES.items():
        if v.name.lower() == clean_key.lower():
            return v
    raise ValueError(f"Unknown city: {city_key}. Available: {list(FLORIDA_CITIES.keys())}")
