export type AuthRole = 'Cast' | 'Staff' | 'Manager' | 'Supervisor' | 'Admin' | 'Owner';

export interface AuthUser {
  user_id: string;
  username: string;
  email: string;
  role: AuthRole;
  store_id: string | null;
  store_name: string | null;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user_id: string;
  username: string;
  email: string;
  role: AuthRole;
  store_id: string | null;
  store_name: string | null;
}
