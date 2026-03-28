/**
 * Mapbox public access token — loaded from .env (EXPO_PUBLIC_MAPBOX_TOKEN).
 * .env is gitignored and never committed.
 *
 * To add a new dev to the project, share the token privately and have them
 * create their own .env file at the project root with:
 *   EXPO_PUBLIC_MAPBOX_TOKEN=pk.your_token_here
 *
 * The Mapbox secret download token (sk.*) lives in ~/.netrc — also gitignored.
 */
export const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';
