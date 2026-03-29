from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from pydantic import BaseModel
import httpx
import json

api_router = APIRouter()

class DoctorResponse(BaseModel):
    name: str
    specialties: List[str]
    phone: Optional[str]
    address: Optional[str]
    npi: Optional[str]

@api_router.get("/doctors/search")
async def search_doctors(
    provider: str = Query(..., description="The insurance provider ID"),
    specialty: str = Query(None, description="The doctor specialty"),
    city: str = Query(None, description="The Florida city"),
):
    """Search for in-network doctors using the official Florida Blue Public FHIR API or mock data for others."""
    # List of supported mock providers for demo
    MOCK_PROVIDERS = {
        "aetna": "Aetna",
        "unitedhealthcare": "UnitedHealthcare",
        "cigna": "Cigna",
        "humana": "Humana",
        "medicaid": "Medicaid",
        "medicare": "Medicare",
        "ambetter": "Ambetter",
        "molina": "Molina Healthcare",
        "wellcare": "WellCare",
        "none": "Self-Pay"
    }

    doctors = []

    if provider == "florida-blue":
        # Official Florida Blue FHIR R4 Practitioner Endpoint
        url = "https://apigw.bcbsfl.com/interop/interop-developer-portal/emr/api/v1/fhir/Practitioner"
        headers = {
            "X-IBM-Client-ID": "327c81009ea65818eab6ea58e5fddeac",
            "Accept": "application/fhir+json"
        }
        
        async with httpx.AsyncClient() as client:
            try:
                # Fetch a page of practitioners
                response = await client.get(url, params={"_count": 40}, headers=headers, timeout=15.0)
                if response.status_code != 200:
                    # Fallback to mock for Florida Blue if API fails/offline
                    return _get_mock_doctors("Florida Blue", city)
                
                data = response.json()
            except Exception:
                # Fallback to mock for Florida Blue if API connection fails
                return _get_mock_doctors("Florida Blue", city)

        entries = data.get("entry", [])
        for entry in entries:
            resource = entry.get("resource", {})
            if resource.get("resourceType") == "Practitioner":
                # Parse Name
                names = resource.get("name", [])
                full_name = "Unknown Provider"
                if names:
                    family = names[0].get("family", "")
                    given = " ".join(names[0].get("given", []))
                    full_name = f"{given} {family}".strip()

                # Parse Specialties
                quals = resource.get("qualification", [])
                spec_list = []
                for q in quals:
                    text = q.get("code", {}).get("text")
                    if text:
                        spec_list.append(text)

                # Filtering (Heuristic for dev phase)
                if specialty and not any(specialty.lower() in s.lower() for s in spec_list):
                    continue

                # Parse NPI
                identifiers = resource.get("identifier", [])
                npi = None
                for ident in identifiers:
                    if "npi" in ident.get("system", "").lower():
                        npi = ident.get("value")

                # Parse Phone
                telecoms = resource.get("telecom", [])
                phone = "Not Available"
                for t in telecoms:
                    if t.get("system") == "phone":
                        phone = t.get("value")

                # Parse Address (Standard FHIR lookups)
                address = f"{city or 'Various'}, FL"
                
                # Check for extensions with address info (common in BCBS FHIR)
                exts = resource.get("extension", [])
                for ext in exts:
                    val_addr = ext.get("valueAddress")
                    if val_addr:
                        line = val_addr.get("line", [""])[0] if val_addr.get("line") else ""
                        c_str = val_addr.get("city", "")
                        s_str = val_addr.get("state", "")
                        z_str = val_addr.get("postalCode", "")
                        if line or c_str:
                            address = f"{line}, {c_str}, {s_str} {z_str}".strip(", ")

                if not spec_list:
                    spec_list = ["HCP / Specialist"]

                doctors.append(DoctorResponse(
                    name=full_name,
                    specialties=spec_list,
                    phone=phone,
                    address=address,
                    npi=npi
                ))

        # Sort alphabetically
        doctors.sort(key=lambda d: d.name)
        return doctors
    
    elif provider in MOCK_PROVIDERS:
        return _get_mock_doctors(MOCK_PROVIDERS[provider], city)
    
    return []

def _get_mock_doctors(plan_name: str, city: str | None) -> List[DoctorResponse]:
    """Generate realistic mock data for insurance search demo."""
    city_name = city or "Orlando"
    
    # Generic realistic providers based on the plan
    if plan_name == "Self-Pay":
        return [
            DoctorResponse(name="Community Health Center", specialties=["Primary Care", "Social Services"], phone="407-123-4567", address=f"101 Wellness Way, {city_name}, FL", npi="1234567890"),
            DoctorResponse(name="Orange County Health Dept", specialties=["Public Health", "Vaccinations"], phone="407-555-0199", address=f"832 W Central Blvd, {city_name}, FL", npi="0987654321"),
            DoctorResponse(name="Night Lite Pediatrics", specialties=["Pediatrics", "Urgent Care"], phone="407-999-8888", address=f"Various Locations, {city_name}, FL", npi="1122334455")
        ]
    
    return [
        DoctorResponse(name=f"{plan_name} Care Plus", specialties=["Multi-Specialty Clinic"], phone="800-555-0123", address=f"123 Insurance Ave, {city_name}, FL", npi="1020304050"),
        DoctorResponse(name=f"Dr. Sarah Miller, MD", specialties=["Family Medicine"], phone="407-555-0101", address=f"456 Medical Park, {city_name}, FL", npi="5040302010"),
        DoctorResponse(name=f"HealthFirst Urgent Care", specialties=["Emergency Services"], phone="407-555-0911", address=f"789 Rapid St, {city_name}, FL", npi="9988776655"),
        DoctorResponse(name=f"Sunshine Regional Hospital", specialties=["General Hospital"], phone="407-555-7777", address=f"1 Florida Way, {city_name}, FL", npi="6655443322")
    ]

