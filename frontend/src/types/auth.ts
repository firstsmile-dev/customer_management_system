export type AuthRole = 'Cast' | 'Staff' | 'Manager' | 'Admin';

export interface AuthUser {
  user_id: string;
  username: string;
  email: string;
  role: AuthRole;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user_id: string;
  username: string;
  email: string;
  role: AuthRole;
}
