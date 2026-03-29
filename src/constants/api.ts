import { Platform } from 'react-native';

// When running on simulator, localhost works for iOS, but Android needs 10.0.2.2.
// Alternatively, your local IP (e.g., 192.168.1.X) is safest for physical devices.
const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Default to localhost for iOS / Web simulator
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
  
  return 'http://127.0.0.1:8000';
};

export const API_BASE_URL = getBaseUrl();
