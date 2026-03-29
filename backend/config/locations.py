"""
SickSense — Health Facility Locations (MVP).
Coordinates for major Walgreens, CVS, and Hospital systems (AdventHealth/TGH/Memorial/etc.) 
across the 7 Florida MVP cities.
"""

from typing import TypedDict, Literal

MarkerType = Literal['pharmacy', 'hospital', 'testing-site']

class MapMarker(TypedDict):
    id: str
    name: str
    type: MarkerType
    city: str
    coordinates: list[float]  # [lng, lat] for Mapbox Compatibility

HEALTH_LOCATIONS: list[MapMarker] = [
    # --- ORLANDO ---
    {"id": "adv-orl-main", "name": "AdventHealth Orlando", "type": "hospital", "city": "Orlando", "coordinates": [-81.3700, 28.5753]},
    {"id": "adv-orl-east", "name": "AdventHealth East Orlando", "type": "hospital", "city": "Orlando", "coordinates": [-81.2806, 28.5406]},
    {"id": "wal-orl-colonial", "name": "Walgreens 24h (Colonial)", "type": "pharmacy", "city": "Orlando", "coordinates": [-81.3525, 28.5528]},
    {"id": "cvs-orl-world", "name": "CVS Pharmacy (World Center)", "type": "pharmacy", "city": "Orlando", "coordinates": [-81.4883, 28.3758]},
    {"id": "wal-orl-idrive", "name": "Walgreens (International Dr)", "type": "pharmacy", "city": "Orlando", "coordinates": [-81.4703, 28.4069]},
    {"id": "cvs-orl-orange", "name": "CVS Pharmacy (Orange Blossom)", "type": "pharmacy", "city": "Orlando", "coordinates": [-81.3969, 28.3917]},

    # --- TAMPA ---
    {"id": "tgh-main", "name": "Tampa General Hospital", "type": "hospital", "city": "Tampa", "coordinates": [-82.4522, 27.9376]},
    {"id": "adv-tpa-main", "name": "AdventHealth Tampa", "type": "hospital", "city": "Tampa", "coordinates": [-82.4339, 28.0645]},
    {"id": "wal-tpa-kennedy", "name": "Walgreens (Kennedy Blvd)", "type": "pharmacy", "city": "Tampa", "coordinates": [-82.4831, 27.9442]},
    {"id": "cvs-tpa-nebraska", "name": "CVS Pharmacy (Nebraska Ave)", "type": "pharmacy", "city": "Tampa", "coordinates": [-82.4513, 28.0315]},
    {"id": "wal-tpa-dale", "name": "Walgreens (Dale Mabry)", "type": "pharmacy", "city": "Tampa", "coordinates": [-82.5025, 27.9942]},

    # --- MIAMI ---
    {"id": "um-miami", "name": "UHealth Jackson South", "type": "hospital", "city": "Miami", "coordinates": [-80.3540, 25.6030]},
    {"id": "wal-mia-collins", "name": "Walgreens (Collins Ave)", "type": "pharmacy", "city": "Miami", "coordinates": [-80.1215, 25.8505]},
    {"id": "cvs-mia-8th", "name": "CVS Pharmacy (Calle Ocho)", "type": "pharmacy", "city": "Miami", "coordinates": [-80.2081, 25.7645]},
    {"id": "wal-mia-flagler", "name": "Walgreens (Flagler St)", "type": "pharmacy", "city": "Miami", "coordinates": [-80.3421, 25.7725]},

    # --- JACKSONVILLE ---
    {"id": "bap-jax-main", "name": "Baptist Medical Center Jacksonville", "type": "hospital", "city": "Jacksonville", "coordinates": [-81.6575, 30.3164]},
    {"id": "wal-jax-sanmarco", "name": "Walgreens (San Marco)", "type": "pharmacy", "city": "Jacksonville", "coordinates": [-81.6515, 30.3015]},
    {"id": "cvs-jax-beach", "name": "CVS Pharmacy (Beach Blvd)", "type": "pharmacy", "city": "Jacksonville", "coordinates": [-81.5215, 30.2845]},
    {"id": "wal-jax-main", "name": "Walgreens (Main St)", "type": "pharmacy", "city": "Jacksonville", "coordinates": [-81.6585, 30.3415]},

    # --- TALLAHASSEE ---
    {"id": "tmh-main", "name": "Tallahassee Memorial Health", "type": "hospital", "city": "Tallahassee", "coordinates": [-84.2692, 30.4551]},
    {"id": "wal-tal-monroe", "name": "Walgreens (North Monroe)", "type": "pharmacy", "city": "Tallahassee", "coordinates": [-84.2885, 30.4685]},
    {"id": "cvs-tal-tennessee", "name": "CVS Pharmacy (Tennessee St)", "type": "pharmacy", "city": "Tallahassee", "coordinates": [-84.2985, 30.4485]},
    {"id": "wal-tal-apala", "name": "Walgreens (Apalachee Pkwy)", "type": "pharmacy", "city": "Tallahassee", "coordinates": [-84.2485, 30.4385]},

    # --- GAINESVILLE ---
    {"id": "uf-shands", "name": "UF Health Shands Hospital", "type": "hospital", "city": "Gainesville", "coordinates": [-82.3428, 29.6385]},
    {"id": "wal-gnv-13th", "name": "Walgreens (NW 13th St)", "type": "pharmacy", "city": "Gainesville", "coordinates": [-82.3385, 29.6645]},
    {"id": "cvs-gnv-university", "name": "CVS Pharmacy (University Ave)", "type": "pharmacy", "city": "Gainesville", "coordinates": [-82.3245, 29.6518]},
    {"id": "wal-gnv-archer", "name": "Walgreens (Archer Rd)", "type": "pharmacy", "city": "Gainesville", "coordinates": [-82.3845, 29.6245]},

    # --- FORT LAUDERDALE ---
    {"id": "brow-general", "name": "Broward Health Medical Center", "type": "hospital", "city": "fort_lauderdale", "coordinates": [-80.1405, 26.1085]},
    {"id": "wal-ftl-sunrise", "name": "Walgreens (Sunrise Blvd)", "type": "pharmacy", "city": "fort_lauderdale", "coordinates": [-80.1215, 26.1385]},
    {"id": "cvs-ftl-federal", "name": "CVS Pharmacy (Federal Hwy)", "type": "pharmacy", "city": "fort_lauderdale", "coordinates": [-80.1215, 26.0945]},
    {"id": "wal-ftl-lasolas", "name": "Walgreens (Las Olas)", "type": "pharmacy", "city": "fort_lauderdale", "coordinates": [-80.1385, 26.1185]},
]
