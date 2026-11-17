export interface UserSession {
  id: number | string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix_1name?: string;
  username: string;
  email?: string;
  phone?: string;
  address?: string;
  role: string;
  avatar?: string;
}

class AuthStore {
  private currentUser: UserSession | null = null;
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const storedUser = localStorage.getItem('tmu_app_user');
        const storedToken = localStorage.getItem('tmu_app_token');
        if (storedUser) {
          this.currentUser = JSON.parse(storedUser);
        }
        if (storedToken) {
          this.token = storedToken;
        }
      } catch {}
    }
  }

  public setUser(user: UserSession, token?: string) {
    this.currentUser = user;
    if (token) {
      this.token = token;
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('tmu_app_user', JSON.stringify(user));
        if (token) {
          localStorage.setItem('tmu_app_token', token);
        }
      } catch {}
    }
  }

  public isAuthenticated(): boolean {
    return !!this.currentUser && !!this.token;
  }

  public getUser(): UserSession {
    if (this.currentUser) {
      return this.currentUser;
    }
    // Default fallback session for unauthenticated preview
    return {
      id: 12,
      first_name: 'Juan',
      last_name: 'Citizen',
      username: 'citizen',
      email: 'citizen@example.com',
      phone: '+63 912 345 6789',
      address: 'Roxas City',
      role: 'citizen',
    };
  }

  public getToken(): string | null {
    return this.token;
  }

  public clearSession() {
    this.currentUser = null;
    this.token = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem('tmu_app_user');
        localStorage.removeItem('tmu_app_token');
      } catch {}
    }
  }
}

export const authStore = new AuthStore();
