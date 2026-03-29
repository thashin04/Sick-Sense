import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../api/firebase';
import { oauthLogin } from '../api/auth';
import { OAUTH_CONFIG } from '../constants/oauth';

// Complete Google OAuth cycle: Sign-In with Google -> Exchange for Firebase ID Token -> Sign In Backend
WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [isLoading, setIsLoading] = React.useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: OAUTH_CONFIG.google.webClientId,
    iosClientId: OAUTH_CONFIG.google.iosClientId,
    androidClientId: OAUTH_CONFIG.google.androidClientId,
  });

  const login = async () => {
    setIsLoading(true);
    try {
      const result = await promptAsync();
      
      if (result?.type === 'success') {
        const { id_token } = result.params;

        // 1. Create a Firebase credential with the Google ID Token
        const credential = GoogleAuthProvider.credential(id_token);

        // 2. Sign in to Firebase on the frontend
        const userCredential = await signInWithCredential(auth, credential);

        // 3. Get the *Firebase ID Token* from the authenticated user
        const firebaseIdToken = await userCredential.user.getIdToken();

        // 4. Send the Firebase ID Token to the custom backend for persistence
        const authData = await oauthLogin(firebaseIdToken);
        
        return authData;
      }
      return null;
    } catch (error) {
      console.error("[GoogleAuth] Error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, isReady: !!request };
}
