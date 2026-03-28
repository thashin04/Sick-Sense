from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from backend.config.cities import FLORIDA_CITIES, get_city
from backend.orchestrator import create_orchestrator
from backend.db.firebase import save_self_report, get_city_summary

app = FastAPI(
    title="SickSense API",
    description="Health outbreak detection API powered by multi-agent AI",
    version="1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScanRequest(BaseModel):
    city: str


class ScanResponse(BaseModel):
    city: str
    timestamp: str
    report: str
    status: str = "completed"


class CityInfo(BaseModel):
    key: str
    name: str
    lat: float
    lng: float


class SelfReportRequest(BaseModel):
    report_type: str
    location_type: str
    location: str


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "sicksense", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/api/cities", response_model=list[CityInfo])
async def list_cities():
    return [
        CityInfo(key=k, name=v.name, lat=v.lat, lng=v.lng)
        for k, v in FLORIDA_CITIES.items()
    ]


@app.post("/api/reports")
async def submit_self_report(request: SelfReportRequest):
    """Submit a user self-report about health issues, contacts, or shortages."""
    try:
        try:
            city_cfg = get_city(request.location)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid location. Must be a supported Florida city.")
            
        report_data = {
            "report_type": request.report_type,
            "location_type": request.location_type,
            "location": city_cfg.name,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        doc_id = save_self_report(report_data)
        if not doc_id:
            raise HTTPException(status_code=500, detail="Failed to save report to database.")
            
        return {"status": "success", "id": doc_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Submission failed: {str(e)}")


@app.post("/api/scan", response_model=ScanResponse)
async def scan_city(request: ScanRequest):
    """Trigger a health outbreak scan for a specific city.
    Runs the full Scout → Analyst → Advisor pipeline via the orchestrator.
    """
    try:
        city_cfg = get_city(request.city)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        orchestrator = create_orchestrator()
        session_service = InMemorySessionService()

        runner = Runner(
            agent=orchestrator,
            app_name="sicksense",
            session_service=session_service,
        )

        session = await session_service.create_session(
            app_name="sicksense",
            user_id="api_user",
        )

        user_message = types.Content(
            role="user",
            parts=[types.Part(text=f"Scan {city_cfg.name}, Florida for health outbreaks. Run the full pipeline.")],
        )

        final_response = ""
        async for event in runner.run_async(
            user_id="api_user",
            session_id=session.id,
            new_message=user_message,
        ):
            if event.is_final_response():
                for part in event.content.parts:
                    if part.text:
                        final_response += part.text

        return ScanResponse(
            city=city_cfg.name,
            timestamp=datetime.now(timezone.utc).isoformat(),
            report=final_response,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")


@app.get("/api/city/{city}/summary")
async def get_city_health_summary(city: str):
    """Retrieve the latest structured virus risks and OTC stock for a city."""
    try:
        city_cfg = get_city(city)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    summary = get_city_summary(city_cfg.name)
    if not summary:
        raise HTTPException(status_code=404, detail=f"No summary found for {city_cfg.name}")
        
    return summary

@app.get("/api/city/{city}/daily-report")
async def get_daily_tts_report(city: str):
    """Retrieve the synthesized Text-to-Speech script for the Expo Native App."""
    try:
        city_cfg = get_city(city)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    # Lazy init or retrieve active connection
    from backend.db.firebase import init_firebase
    db = init_firebase()
    if not db:
        raise HTTPException(status_code=500, detail="Database uninitialized")
        
    doc = db.collection("daily_tts_reports").document(city).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail=f"No daily TTS script available for {city_cfg.name}")
        
    return doc.to_dict()

@app.post("/api/scan/all")
async def scan_all_cities():
    results = []
    for city_key, city_cfg in FLORIDA_CITIES.items():
        try:
            result = await scan_city(ScanRequest(city=city_key))
            results.append(result.model_dump())
        except Exception as e:
            results.append({
                "city": city_cfg.name,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "report": f"Error: {str(e)}",
                "status": "failed",
            })
    return {"results": results, "total": len(results)}
