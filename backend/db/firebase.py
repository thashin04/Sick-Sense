import os
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timezone

# Initialize Firebase on module load if credentials are set
_db = None
_init_attempted = False

def init_firebase():
    global _db, _init_attempted
    if _init_attempted:
        return _db
        
    _init_attempted = True
    cred_path = os.getenv("FIREBASE_CREDENTIALS")
    if cred_path and os.path.exists(cred_path):
        try:
            cred = credentials.Certificate(cred_path)
            if not firebase_admin._apps:
                firebase_admin.initialize_app(cred)
            _db = firestore.client()
            print("[Firebase] Initialized successfully.")
        except Exception as e:
            print(f"[Firebase] Initialization failed: {e}")
    else:
        print("[Firebase] FIREBASE_CREDENTIALS not set or missing file. Skipping Firebase init.")
        
    return _db

def save_health_data(city: str, source: str, data: dict):
    """
    Saves collected health data to the 'health_data' Firestore collection.
    Document ID will be automatically generated.
    """
    db = init_firebase()
    if not db:
        return None
        
    try:
        doc_ref = db.collection("health_data").document()
        doc_ref.set({
            "city": city,
            "source": source,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": data
        })
        return doc_ref.id
    except Exception as e:
        print(f"[Firebase] Error saving to Firestore: {e}")
        return None

def save_self_report(report_data: dict):
    """
    Saves a user self-report to the 'self_reports' Firestore collection.
    Document ID will be automatically generated.
    """
    db = init_firebase()
    if not db:
        return None
        
    try:
        # Add server-side timestamp as a fallback/record
        if "timestamp" not in report_data:
            report_data["timestamp"] = datetime.now(timezone.utc).isoformat()
            
        doc_ref = db.collection("self_reports").document()
        doc_ref.set(report_data)
        return doc_ref.id
    except Exception as e:
        print(f"[Firebase] Error saving self report to Firestore: {e}")
        return None

def get_recent_self_reports(city: str, days: int = 7) -> list[dict]:
    """
    Retrieves user self-reports for a specific city within the last X days.
    """
    db = init_firebase()
    if not db:
        return []

    try:
        from datetime import timedelta
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        cutoff_iso = cutoff_date.isoformat()

        docs = (
            db.collection("self_reports")
            .where("location", "==", city)
            .where("timestamp", ">=", cutoff_iso)
            .stream()
        )
        
        reports = []
        for doc in docs:
            reports.append(doc.to_dict())
            
        return reports
    except Exception as e:
        print(f"[Firebase] Error retrieving self reports: {e}")
        return []
