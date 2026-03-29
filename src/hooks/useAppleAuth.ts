import * as React from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { OAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../api/firebase';
import { oauthLogin } from '../api/auth';

/**
 * Apple Authentication Hook
 * Generates a secure nonce, requests Apple context, and exchanges for a Firebase Token.
 */
export function useAppleAuth() {
  const [isLoading, setIsLoading] = React.useState(false);

  // Generate a cryptographically secure random string for the nonce
  const generateNonce = async (length: number) => {
    const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';
    const randomBytes = await Crypto.getRandomBytesAsync(length);
    for (let i = 0; i < length; i++) {
        result += charset[randomBytes[i] % charset.length];
    }
    return result;
  };

  const login = async () => {
    setIsLoading(true);
    try {
      const rawNonce = await generateNonce(32);
      const state = await generateNonce(16);

      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: rawNonce,
        state: state,
      });

      const { identityToken } = appleCredential;

      if (identityToken) {
        // 1. Create a Firebase credential with the Apple Identity Token
        const provider = new OAuthProvider('apple.com');
        const credential = provider.credential({
          idToken: identityToken,
          rawNonce,
        });

        // 2. Sign in to Firebase on the frontend
        const userCredential = await signInWithCredential(auth, credential);

        // 3. Get the *Firebase ID Token* from the authenticated user
        const firebaseIdToken = await userCredential.user.getIdToken();

        // 4. Send the Firebase ID Token to the custom backend for persistence
        return await oauthLogin(firebaseIdToken);
      }
      return null;
    } catch (error: any) {
      if (error.code === 'ERR_CANCELED') {
        return null; // User cancelled the login
      }
      console.error("[AppleAuth] Error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, isAvailable: AppleAuthentication.isAvailableAsync() };
}
