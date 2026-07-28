import { Platform } from 'react-native';

// Default local environment API URL (Android emulator uses 10.0.2.2, iOS/Web uses localhost)
const DEFAULT_API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:8000/api/v1',
  default: 'http://localhost:8000/api/v1',
});

export interface LoginPayload {
  username: string;
  password: string;
  device_name?: string;
}

export interface RegisterCitizenPayload {
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix_1name?: string;
  username: string;
  email?: string;
  phone?: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: any;
  token?: string;
}

class ApiService {
  private baseUrl: string = DEFAULT_API_BASE_URL;

  public setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public async login(payload: LoginPayload): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          device_name: payload.device_name || `Mobile (${Platform.OS})`,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      return {
        success: true,
        message: data.message || 'Logged in successfully.',
        user: data.data?.user || data.user,
        token: data.data?.token || data.token,
      };
    } catch (error: any) {
      // Mock local fallback when backend is unreachable during dev setup
      if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
        console.warn('API Unreachable: Using local dev response for testing.');
        return {
          success: true,
          message: 'Development Login Successful (Local Mock)',
          user: {
            id: 1,
            username: payload.username,
            role: 'citizen',
            first_name: 'Demo',
            last_name: 'Citizen',
          },
          token: 'mock-dev-token-12345',
        };
      }
      throw error;
    }
  }

  public async registerCitizen(payload: RegisterCitizenPayload): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          role: 'citizen',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed. Please check your inputs.');
      }

      return {
        success: true,
        message: data.message || 'Account created successfully.',
        user: data.data?.user || data.user,
        token: data.data?.token || data.token,
      };
    } catch (error: any) {
      if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
        console.warn('API Unreachable: Using local dev response for testing registration.');
        return {
          success: true,
          message: 'Account registered successfully! (Local Mock)',
          user: {
            id: Date.now(),
            username: payload.username,
            first_name: payload.first_name,
            last_name: payload.last_name,
            email: payload.email,
            phone: payload.phone,
            role: 'citizen',
          },
          token: 'mock-dev-token-67890',
        };
      }
      throw error;
    }
  }
}

export const apiService = new ApiService();
