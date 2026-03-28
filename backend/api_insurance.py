import httpx
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(prefix="/api/insurance", tags=["Insurance Finder"])

FL_BLUE_BASE = "https://apigw.bcbsfl.com/interop/interop-developer-portal/emr/api/v1/fhir"
FL_BLUE_HEADERS = {
    "X-IBM-Client-Id": "327c81009ea65818eab6ea58e5fddeac",
    "Accept": "application/fhir+json",
}

class InsurancePlanResponse(BaseModel):
    id: str
    name: str

class SpecialtyResponse(BaseModel):
    code: str
    display: str

class DoctorResponse(BaseModel):
    name: str
    specialties: list[str]
    phone: str
    address: str
    npi: str

# FHIR uses the National Uniform Claim Committee (NUCC) taxonomy.
SPECIALTY_MAP = [
    {"code": "207Q00000X", "display": "Family Medicine"},
    {"code": "207R00000X", "display": "Internal Medicine"},
    {"code": "208D00000X", "display": "General Practice"},
    {"code": "208000000X", "display": "Pediatrics"},
    {"code": "207RC0000X", "display": "Cardiovascular Disease (Cardiology)"},
    {"code": "207N00000X", "display": "Dermatology"},
    {"code": "207RR0500X", "display": "Rheumatology"},
    {"code": "207K00000X", "display": "Allergy & Immunology"},
]

@router.get("/plans", response_model=list[InsurancePlanResponse])
async def get_insurance_plans():
    """Retrieve all available Florida Blue insurance networks/plans."""
    async with httpx.AsyncClient() as client:
        # Networks hold the providers in FHIR Plan Net
        resp = await client.get(
            f"{FL_BLUE_BASE}/Organization?type=ntwk&_count=50",
            headers=FL_BLUE_HEADERS
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail="Failed to fetch Florida Blue networks")
            
        data = resp.json()
        plans = []
        for entry in data.get("entry", []):
            resource = entry.get("resource", {})
            plans.append(InsurancePlanResponse(
                id=resource.get("id", ""),
                name=resource.get("name", "Unknown Network")
            ))
        return plans

@router.get("/specialties", response_model=list[SpecialtyResponse])
async def get_specialties():
    """Returns a list of common doctor specialties supported by the API."""
    return [SpecialtyResponse(**s) for s in SPECIALTY_MAP]


from backend.scrapers.fl_blue_internal import fetch_florida_blue_internal

@router.get("/doctors", response_model=list[DoctorResponse])
async def find_doctors(
    city: str = Query(..., description="City to search in, e.g., Orlando"),
    specialty_code: str = Query(None, description="NUCC Taxonomy specialty code (e.g., '207RC0000X')"),
    network_id: str = Query(None, description="Florida Blue Internal Plan Code")
):
    """Search for in-network doctors using Florida Blue's public sandbox API and manual Python filtering."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        # We purposely OMIT specialty from the URL query to bypass Sandbox limitations
        params = {
            "location.address-city": city,
            "_count": 50,
            "_include": ["PractitionerRole:practitioner", "PractitionerRole:location"]
        }

        resp = await client.get(
            f"{FL_BLUE_BASE}/PractitionerRole",
            headers=FL_BLUE_HEADERS,
            params=params
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail="Failed to fetch doctors")
            
        data = resp.json()
        
        # Flatten FHIR _include graph (Resolving relative references)
        practitioners = {}
        locations = {}
        
        for entry in data.get("entry", []):
            resource = entry.get("resource", {})
            res_type = resource.get("resourceType")
            res_id = resource.get("id")
            key = f"{res_type}/{res_id}"
            
            if res_type == "Practitioner":
                practitioners[key] = resource
            elif res_type == "Location":
                locations[key] = resource

        doctors = []
        seen_npis = set()
        
        # Build a fast mapping for specialty names based on our dict
        spec_dict = {s["code"]: s["display"] for s in SPECIALTY_MAP}
        
        for entry in data.get("entry", []):
            resource = entry.get("resource", {})
            if resource.get("resourceType") == "PractitionerRole":
                
                # EXTRACT SPECIALTIES & CODES
                spec_list = []
                spec_codes = []
                for spec in resource.get("specialty", []):
                    for coding in spec.get("coding", []):
                        code = coding.get("code")
                        if code:
                            spec_codes.append(code)
                            # Instead of trusting the API's potentially 'unknown' display name, map it ourselves
                            if code in spec_dict:
                                spec_list.append(spec_dict[code])
                            else:
                                disp = coding.get("display", "")
                                if disp and disp.lower() != "unknown":
                                    spec_list.append(disp)
                            
                # APPLY LOCAL PYTHON FILTERING
                if specialty_code and specialty_code not in spec_codes:
                    continue  # Skip this doctor if they don't have the requested specialty code!
                
                # Get Name & NPI FIRST for deduplication
                name = "Unknown Doctor"
                npi = "N/A"
                prac_ref = resource.get("practitioner", {}).get("reference")
                prac_obj = practitioners.get(prac_ref, {})
                if prac_obj:
                    names = prac_obj.get("name", [])
                    if names:
                        first_name = " ".join(names[0].get("given", []))
                        last_name = names[0].get("family", "")
                        suffix = " ".join(names[0].get("suffix", []))
                        name = f"{first_name} {last_name} {suffix}".strip()
                    
                    for identifier in prac_obj.get("identifier", []):
                        if "us-npi" in identifier.get("system", ""):
                            npi = identifier.get("value", "N/A")
                            break
                            
                # DEDUPLICATE BY NPI
                if npi in seen_npis and npi != "N/A":
                    continue
                seen_npis.add(npi)
                
                # Get Phone
                phone = "Not Available"
                for contact in resource.get("telecom", []):
                    if contact.get("system") == "phone":
                        phone = contact.get("value", phone)
                        break

                # Get Address
                address = "Not Available"
                loc_refs = resource.get("location", [])
                if loc_refs:
                    first_loc_ref = loc_refs[0].get("reference")
                    loc_obj = locations.get(first_loc_ref, {})
                    addr_obj = loc_obj.get("address", {})
                    line = addr_obj.get("line", [""])[0] if addr_obj.get("line") else ""
                    city_str = addr_obj.get("city", "")
                    state_str = addr_obj.get("state", "")
                    zip_str = addr_obj.get("postalCode", "")
                    if line or city_str:
                        address = f"{line}, {city_str}, {state_str} {zip_str}".strip(", ")

                # Fallback if no valid specialties found
                if not spec_list:
                    spec_list = ["General Practice"]

                doctors.append(DoctorResponse(
                    name=name,
                    specialties=spec_list,
                    phone=phone,
                    address=address,
                    npi=npi
                ))

        # Sort alphabetically for a good user experience
        doctors.sort(key=lambda d: d.name)
        return doctors
