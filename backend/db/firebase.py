import os
import secrets
import hashlib
import firebase_admin
from firebase_admin import credentials, firestore, auth
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

def get_city_summary(city: str) -> dict | None:
    """
    Retrieves the latest structured health summary for a specific city.
    """
    db = init_firebase()
    if not db:
        return None

    try:
        doc_ref = db.collection("city_health_summaries").document(city)
        doc = doc_ref.get()
        if doc.exists:
            return doc.to_dict()
        return None
    except Exception as e:
        print(f"[Firebase] Error retrieving city summary: {e}")
        return None

def save_city_summary(city: str, summary_data: dict) -> bool:
    """
    Saves or updates a structured health summary for a specific city.
    Uses merge=True to allow different agents to update different fields.
    """
    db = init_firebase()
    if not db:
        return False

    try:
        doc_ref = db.collection("city_health_summaries").document(city)
        # Add server-side timestamp mapping if not provided
        if "timestamp" not in summary_data:
            summary_data["timestamp"] = datetime.now(timezone.utc).isoformat()
            
        doc_ref.set(summary_data, merge=True)
        return True
    except Exception as e:
        print(f"[Firebase] Error saving city summary: {e}")
        return False

# --- AUTHENTICATION METHODS ---

def _hash_password(password: str, salt: bytes = None) -> tuple[str, str]:
    """Hashes a password with an optional salt using pbkdf2_hmac."""
    if salt is None:
        salt = os.urandom(16)
    # Using 100,000 iterations for SHA-256 is suitably secure
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return salt.hex(), key.hex()

def create_user(email: str, password: str, name: str = None) -> dict:
    """Creates a new user with a securely hashed password in Firestore."""
    db = init_firebase()
    if not db:
        raise RuntimeError("Firebase not initialized")

    # Lowercase email for consistent querying
    email_lower = email.lower().strip()
    
    # Check if user already exists
    users_ref = db.collection("users")
    existing = users_ref.where("email", "==", email_lower).limit(1).get()
    if existing:
        raise ValueError(f"User with email {email_lower} already exists")
    
    salt_hex, hash_hex = _hash_password(password)
    
    user_data = {
        "email": email_lower,
        "name": name,
        "password_hash": hash_hex,
        "salt": salt_hex,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "auth_provider": "local"
    }
    
    doc_ref = users_ref.document()
    doc_ref.set(user_data)
    
    return {"uid": doc_ref.id, "email": email_lower, "name": name}

def verify_password_login(email: str, password: str) -> dict:
    """Verifies a user's password against the stored hash in Firestore."""
    db = init_firebase()
    if not db:
        raise RuntimeError("Firebase not initialized")
        
    email_lower = email.lower().strip()
    users_ref = db.collection("users")
    matching_users = users_ref.where("email", "==", email_lower).limit(1).get()
    
    if not matching_users:
        raise ValueError("Invalid email or password")
        
    user_doc = matching_users[0]
    user_data = user_doc.to_dict()
    
    if user_data.get("auth_provider") != "local":
        raise ValueError(f"User registered via {user_data.get('auth_provider', 'another provider')}. Please use that method to login.")
        
    salt_hex = user_data.get("salt")
    stored_hash = user_data.get("password_hash")
    
    if not salt_hex or not stored_hash:
        raise ValueError("User account configuration error")
        
    salt_bytes = bytes.fromhex(salt_hex)
    _, computed_hash = _hash_password(password, salt_bytes)
    
    if computed_hash != stored_hash:
        raise ValueError("Invalid email or password")
        
    return {"uid": user_doc.id, "email": email_lower, "name": user_data.get("name")}

def verify_oauth_login(id_token: str) -> dict:
    """Verifies a Firebase ID token (Google/Apple) and syncs user to Firestore."""
    db = init_firebase()
    if not db:
        raise RuntimeError("Firebase not initialized")
        
    try:
        # Verify the Firebase ID token
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token.get("uid")
        email = decoded_token.get("email", "").lower().strip()
        name = decoded_token.get("name", "")
        provider = decoded_token.get("firebase", {}).get("sign_in_provider", "oauth")
        
        users_ref = db.collection("users")
        
        # Check if the user already exists by email
        existing_by_email = users_ref.where("email", "==", email).limit(1).get()
        if existing_by_email:
            user_doc = existing_by_email[0]
            # Optionally update info, but we just return existing
            return {"uid": user_doc.id, "email": email, "name": user_doc.to_dict().get("name")}
            
        # Create new user for OAuth
        user_data = {
            "email": email,
            "name": name,
            "firebase_uid": uid,
            "auth_provider": provider,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        doc_ref = users_ref.document()
        doc_ref.set(user_data)
        
        return {"uid": doc_ref.id, "email": email, "name": name}
        
    except Exception as e:
        print(f"[Firebase] OAuth verification error: {e}")
        raise ValueError("Invalid authentication token")

def update_user_preferences(uid: str, preferences: dict) -> bool:
    """Updates a user's preferences in Firestore."""
    db = init_firebase()
    if not db:
        raise RuntimeError("Firebase not initialized")

    try:
        user_ref = db.collection("users").document(uid)
        
        # Check if user exists
        if not user_ref.get().exists:
            raise ValueError("User not found")
            
        user_ref.set({"preferences": preferences}, merge=True)
        return True
    except Exception as e:
        print(f"[Firebase] Error updating preferences: {e}")
        raise ValueError("Could not save user preferences")

def get_user_preferences(uid: str) -> dict:
    """Gets a user's preferences from Firestore."""
    db = init_firebase()
    if not db:
        raise RuntimeError("Firebase not initialized")
    try:
        user_ref = db.collection("users").document(uid)
        doc = user_ref.get()
        if not doc.exists:
            return {}
        return doc.to_dict().get("preferences", {})
    except Exception as e:
        print(f"[Firebase] Error getting preferences: {e}")
        return {}

