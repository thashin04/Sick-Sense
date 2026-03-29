import { API_BASE_URL } from '../constants/api';

/**
 * Triggers a personalized health scan for a specific user ID.
 * This is a "fire-and-forget" call that runs in the background on the server.
 */
export const triggerUserScan = async (uid: string): Promise<void> => {
  try {
    // We don't await this to ensure the onboarding experience stays fast
    fetch(`${API_BASE_URL}/api/scan/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }),
    }).catch(err => console.warn('[Scanner] Background fetch failed:', err));

    console.log(`[Scanner] Personalized scan triggered for UID: ${uid}`);
  } catch (error) {
    console.warn('[Scanner] Failed to trigger background scan:', error);
  }
};
