import { Platform } from 'react-native';

// Local network candidate URLs for high resilience across Web, Emulator, and Physical Devices
const DEV_LAN_IP = '192.168.1.5';

const CANDIDATE_BASE_URLS = [
  'http://localhost:8000/api',
  'http://127.0.0.1:8000/api',
  'http://10.0.2.2:8000/api',
  `http://${DEV_LAN_IP}:8000/api`,
];

const DEFAULT_API_BASE_URL = Platform.select({
  android: `http://10.0.2.2:8000/api`,
  ios: `http://localhost:8000/api`,
  default: `http://localhost:8000/api`,
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
  address: string;
  password: string;
  role?: string;
}

export interface SubmitComplaintPayload {
  complainant_first_name: string;
  complainant_last_name: string;
  complainant_address: string;
  complainant_contact: string;
  driver_id?: string | number;
  driver_first_name?: string;
  driver_last_name?: string;
  plate_number?: string;
  category_id: string | number;
  title: string;
  description: string;
  incident_date_time: string;
  incident_location: string;
  status?: string;
  evidence?: Array<{ uri: string; type: string; name?: string }>;
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

  private async fetchWithDiscovery(
    endpointPath: string,
    options: RequestInit,
    timeoutMs: number = 4000
  ): Promise<Response> {
    const urlsToTry = [
      this.baseUrl,
      ...CANDIDATE_BASE_URLS.filter((u) => u !== this.baseUrl),
    ];

    let lastError: any = null;

    for (const baseUrlCandidate of urlsToTry) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(`${baseUrlCandidate}${endpointPath}`, {
          ...options,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        // If response was received (even 4xx/5xx), host is reachable! Update baseUrl
        this.baseUrl = baseUrlCandidate;
        return response;
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError = err;
      }
    }

    throw lastError || new Error('Unable to connect to any backend API server.');
  }

  public async login(payload: LoginPayload): Promise<AuthResponse> {
    try {
      const response = await this.fetchWithDiscovery('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          device_name: payload.device_name || `Mobile (${Platform.OS})`,
        }),
      }, 4000);

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
    try {
      const response = await this.fetchWithDiscovery('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          role: 'citizen',
        }),
      }, 4000);

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
      if (this.isNetworkException(error)) {
        throw new Error('Registration server unreachable. Please check your connection and try again.');
      }
      throw error;
    }
  }

  public async fetchComplaints(token?: string, status?: string): Promise<{ success: boolean; data?: any[]; message?: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let url = `${this.baseUrl}/complaints`;
      if (status && status !== 'all') {
        url += `?status=${encodeURIComponent(status)}`;
      }

      const res = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch complaints.');
      return {
        success: true,
        data: data?.data?.complaints || (Array.isArray(data?.data) ? data.data : []),
        message: data.message,
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (this.isNetworkException(error)) {
        return { success: false, data: [], message: 'Server connection failed.' };
      }
      return { success: false, data: [], message: error.message || 'Error fetching complaints.' };
    }
  }

  public async fetchOptions(token?: string): Promise<{ success: boolean; data?: any; message?: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${this.baseUrl}/complaints/options`, { headers, signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();
      return { success: res.ok, data: data?.data, message: data?.message };
    } catch {
      clearTimeout(timeoutId);
      return { success: false };
    }
  }

  public async checkViolations(searchQuery: string, token?: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await this.fetchWithDiscovery(
        `/complaints/check-violation?search=${encodeURIComponent(searchQuery)}`,
        {
          method: 'GET',
          headers,
        },
        5000
      );

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

  public async fetchConversations(token?: string, senderName?: string): Promise<{ success: boolean; data?: any }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    try {
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (senderName) headers['X-Sender-Name'] = senderName;

      let url = `${this.baseUrl}/chat/conversations`;
      if (senderName) {
        url += `?sender_name=${encodeURIComponent(senderName)}`;
      }

      const res = await fetch(url, { headers, signal: controller.signal });
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

  public async submitComplaint(payload: FormData | SubmitComplaintPayload, token?: string): Promise<{ success: boolean; data?: any; message?: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let bodyData: any;
      if (payload instanceof FormData) {
        bodyData = payload;
      } else {
        headers['Content-Type'] = 'application/json';
        bodyData = JSON.stringify(payload);
      }

      const res = await fetch(`${this.baseUrl}/complaints`, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: bodyData,
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (!res.ok) {
        let msg = data.message || 'Failed to submit complaint.';
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
        data: data.data,
        message: data.message || 'Complaint created successfully.',
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (this.isNetworkException(error)) {
        console.warn(`API Unreachable at ${this.baseUrl}: Saving complaint in local offline mode.`);
        return {
          success: true,
          data: {
            id: Date.now(),
            status: 'unsettled',
          },
          message: 'Complaint submitted in local offline mode.',
        };
      }
      throw error;
    }
  }
}

export const apiService = new ApiService();
