import { API_BASE_URL } from '../constants/api';

export interface AuthResponse {
  status: string;
  user?: any;
  detail?: string;
}

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Login failed');
    }
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Network request failed');
  }
};

export const signupUser = async (email: string, password: string, name: string): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Signup failed');
    }
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Network request failed');
  }
};

export const updateUserPreferences = async (
  uid: string,
  language: string | null,
  otc_medicine: string[] | null,
  insurance_provider: string | null
): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid,
        language,
        otc_medicine,
        insurance_provider,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Saving preferences failed');
    }
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Network request failed');
  }
};
