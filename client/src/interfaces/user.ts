export type Theme = 'light' | 'dark' | 'system';
export type Role = 'operator' | 'admin' | 'staff' | 'citizen';

export interface User {
  id: number;
  slug: string;
  avatar: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix_1name: string | null;
  name?: string;
  email: string;
  username: string;
  phone: string;
  role: Role;
  theme: Theme;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}