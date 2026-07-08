import type { Role } from "./user";

export interface ActivityLogUser {
  id: number;
  name?: string;
  username: string;
  role: Role;
}

export interface ActivityLog {
  id: number;
  user_id: number | null;
  activity: string;
  timestamp: string;
  user?: ActivityLogUser;
}

