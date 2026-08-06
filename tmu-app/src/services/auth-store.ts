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

  public setUser(user: UserSession, token?: string) {
    this.currentUser = user;
    if (token) {
      this.token = token;
    }
  }

  public getUser(): UserSession {
    if (this.currentUser) {
      return this.currentUser;
    }
    // Default fallback session for unauthenticated preview
    return {
      id: 1,
      first_name: 'Juan',
      last_name: 'Dela Cruz',
      username: 'juandelacruz',
      email: 'juan.delacruz@example.com',
      phone: '+63 912 345 6789',
      address: 'Brgy. San Jose, Pasig City',
      role: 'citizen',
    };
  }

  public getToken(): string | null {
    return this.token;
  }

  public clearSession() {
    this.currentUser = null;
    this.token = null;
  }
}

export const authStore = new AuthStore();
