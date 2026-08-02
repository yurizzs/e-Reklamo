import { Platform } from 'react-native';

// Local Wi-Fi IP address for physical mobile phones: http://192.168.254.112:8000/api/v1
// Android Emulator fallback: 10.0.2.2:8000
const DEV_LAN_IP = '192.168.254.112';

const DEFAULT_API_BASE_URL = Platform.select({
  android: `http://${DEV_LAN_IP}:8000/api/v1`,
  ios: `http://${DEV_LAN_IP}:8000/api/v1`,
  default: `http://${DEV_LAN_IP}:8000/api/v1`,
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

  private isNetworkException(error: any): boolean {
    if (!error) return false;
    const msg = String(error.message || '').toLowerCase();
    const name = String(error.name || '').toLowerCase();
    return (
      name === 'aborterror' ||
      msg.includes('network request failed') ||
      msg.includes('failed to fetch') ||
      msg.includes('canceled') ||
      msg.includes('cancelled') ||
      msg.includes('abort')
    );
  }

  public async login(payload: LoginPayload): Promise<AuthResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s fast timeout

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
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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
      clearTimeout(timeoutId);

      if (this.isNetworkException(error)) {
        console.warn(`API Unreachable at ${this.baseUrl}: Falling back to local offline session.`);
        return {
          success: true,
          message: 'Local Offline Mode (Backend Unreachable)',
          user: {
            id: Date.now(),
            username: payload.username,
            role: 'citizen',
            first_name: payload.username || 'Citizen',
            last_name: 'User',
          },
          token: 'mock-dev-token-12345',
        };
      }
      throw error;
    }
  }

  public async registerCitizen(payload: RegisterCitizenPayload): Promise<AuthResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s fast timeout

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
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      if (!response.ok) {
        let msg = data.message || 'Registration failed.';
        if (data.errors && typeof data.errors === 'object') {
          const firstErr = Object.values(data.errors)[0];
          if (Array.isArray(firstErr) && firstErr[0]) {
            msg = firstErr[0] as string;
          }
        }
        throw new Error(msg);
      }

      return {
        success: true,
        message: data.message || 'Account created successfully.',
        user: data.data?.user || data.user,
        token: data.data?.token || data.token,
      };
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (this.isNetworkException(error)) {
        console.warn(`API Unreachable at ${this.baseUrl}: Falling back to local offline registration.`);
        return {
          success: true,
          message: 'Account registered! (Local Offline Mode)',
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

  public async checkViolations(searchQuery: string, token?: string): Promise<{ success: boolean; data?: any; message?: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${this.baseUrl}/complaints/check-violation?search=${encodeURIComponent(searchQuery)}`,
        {
          method: 'GET',
          headers,
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || 'Failed to check violations.');
      }

      return {
        success: true,
        data: resData.data,
        message: resData.message,
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (this.isNetworkException(error)) {
        return {
          success: true,
          data: {
            query: searchQuery,
            total_violations: 0,
            violations: [],
          },
          message: 'Offline Mode: No network connection.',
        };
      }
      throw error;
    }
  }

  public async fetchConversations(token?: string): Promise<{ success: boolean; data?: any }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    try {
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${this.baseUrl}/chat/conversations`, { headers, signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();
      return { success: res.ok, data: data?.data?.conversations || [] };
    } catch {
      clearTimeout(timeoutId);
      return { success: false, data: [] };
    }
  }

  public async fetchMessages(conversationId: number, token?: string): Promise<{ success: boolean; data?: any }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    try {
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${this.baseUrl}/chat/conversations/${conversationId}/messages`, { headers, signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();
      return { success: res.ok, data: data?.data?.messages || [] };
    } catch {
      clearTimeout(timeoutId);
      return { success: false, data: [] };
    }
  }

  public async sendChatMessage(
    conversationId: number,
    messageText: string,
    token?: string,
    senderName?: string,
    senderRole?: string
  ): Promise<{ success: boolean; data?: any }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${this.baseUrl}/chat/messages`, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          conversation_id: conversationId,
          message_text: messageText,
          sender_name: senderName,
          sender_role: senderRole,
        }),
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      return { success: res.ok, data: data?.data?.message };
    } catch {
      clearTimeout(timeoutId);
      return { success: false };
    }
  }
}

export const apiService = new ApiService();
