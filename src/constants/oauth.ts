/**
 * OAuth Configuration Constants
 * 
 * Replace placeholders with your actual Client IDs from:
 * - Google Cloud Console: https://console.cloud.google.com/apis/credentials
 * - Apple Developer: https://developer.apple.com/account/resources/identifiers
 */

export const OAUTH_CONFIG = {
  google: {
    // Required even for mobile-only apps to exchange tokens with Firebase
    webClientId: 'YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com',
    
    // Platform-specific IDs for use in real apps
    iosClientId: 'YOUR_GOOGLE_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_GOOGLE_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  },
  
  apple: {
    // Your App Store Bundle ID (e.g. com.yourname.sicksense)
    bundleId: 'com.yourname.sicksense',
  },

  // Firebase Web Config (Copy from Firebase Console Settings)
  // Required for the frontend exchange: signInWithCredential()
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project",
    storageBucket: "your-project.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  }
};
