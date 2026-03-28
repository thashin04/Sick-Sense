from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field

class MedicationStock(BaseModel):
    name: str
    typical_stock: int
    current_stock: int
    pct_remaining: float = Field(..., description="0-1 fraction of stock remaining")


class PharmacyReport(BaseModel):
    city: str
    timestamp: datetime
    medications: list[MedicationStock]
    source: str = "mock"


class PollenReport(BaseModel):
    city: str
    timestamp: datetime
    grass_index: int = Field(0, ge=0, le=5)
    tree_index: int = Field(0, ge=0, le=5)
    weed_index: int = Field(0, ge=0, le=5)
    overall_risk: str = ""  # "Low", "Medium", "High", "Very High"
    health_recommendations: list[str] = []
    source: str = "google_pollen_api"


class AirQualityReport(BaseModel):
    city: str
    timestamp: datetime
    aqi: int = Field(0, ge=0)
    dominant_pollutant: str = ""
    category: str = ""  # "Good", "Moderate", "Unhealthy"
    health_recommendations: list[str] = []
    source: str = "google_air_quality_api"


class HospitalBusyness(BaseModel):
    name: str
    busyness_pct: int = Field(..., ge=0, le=100, description="0-100 busyness")
    typical_pct: int = Field(..., ge=0, le=100)
    is_elevated: bool = False


class HospitalReport(BaseModel):
    city: str
    timestamp: datetime
    hospitals: list[HospitalBusyness]
    source: str = "mock"


class SocialPost(BaseModel):
    platform: str = "reddit"
    subreddit: str = ""
    title: str
    snippet: str = ""
    score: int = 0
    created_utc: float = 0


class SocialMediaReport(BaseModel):
    city: str
    timestamp: datetime
    posts: list[SocialPost]
    keyword_counts: dict[str, int] = {}  # keyword -> count
    total_mentions: int = 0
    source: str = "reddit"


class TrendsDataPoint(BaseModel):
    keyword: str
    interest: int = Field(0, ge=0, le=100, description="0-100 relative interest")


class GoogleTrendsReport(BaseModel):
    city: str
    timestamp: datetime
    trends: list[TrendsDataPoint]
    source: str = "pytrends"


class EMSCall(BaseModel):
    call_type: str # "respiratory", "fever", "cardiac", etc.
    count: int
    typical_count: int


class ActiveEMSCall(BaseModel):
    """A single raw EMS/fire dispatch call from a live feed."""
    incident_id: str = ""
    timestamp: str = ""
    description: str = ""        # "Medical Emergency", "MEDICAL", "ME", etc.
    location: str = ""
    agency: str = ""


class EMSReport(BaseModel):
    city: str
    timestamp: datetime
    calls: list[EMSCall]
    active_calls: list[ActiveEMSCall] = []
    total_health_calls: int = 0
    source: str = "mock"


class CDCOutbreak(BaseModel):
    pathogen: str
    locations_affected: list[str]
    status: str
    date_updated: str
    description: str

class CDCOutbreakReport(BaseModel):
    city: str
    timestamp: datetime
    active_outbreaks: list[CDCOutbreak]
    source: str = "cdc_ai_scraper"

class CityDataSnapshot(BaseModel):
    """Everything the Scout collects for one city."""
    city: str
    timestamp: datetime
    pharmacy: Optional[PharmacyReport] = None
    pollen: Optional[PollenReport] = None
    air_quality: Optional[AirQualityReport] = None
    hospitals: Optional[HospitalReport] = None
    social_media: Optional[SocialMediaReport] = None
    google_trends: Optional[GoogleTrendsReport] = None
    ems: Optional[EMSReport] = None
    cdc_outbreaks: Optional[CDCOutbreakReport] = None

class ThreatLevel(str, Enum):
    NONE = "none"
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class AnomalySignal(BaseModel):
    source: str
    description: str
    severity: float = Field(..., ge=0, le=1)


class AnalysisReport(BaseModel):
    city: str
    timestamp: datetime
    threat_score: int = Field(0, ge=0, le=100)
    threat_level: ThreatLevel = ThreatLevel.NONE
    identified_conditions: list[str] = []
    anomalies: list[AnomalySignal] = []
    cross_references: list[str] = []  # human-readable cross-ref notes

class OutbreakAlert(BaseModel):
    city: str
    timestamp: datetime
    threat_score: int
    threat_level: ThreatLevel
    identified_conditions: list[str]
    advisory: str # plain-language advisory
    precautions: list[str]
    recommended_actions: list[str]
    safe_areas_note: str = ""
    data_sources_used: list[str] = []
