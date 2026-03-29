import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { OAUTH_CONFIG } from "../constants/oauth";

// Initialize Firebase App for the frontend
const app = initializeApp(OAUTH_CONFIG.firebase);

// Export Auth instance for signInWithCredential()
export const auth = getAuth(app);
