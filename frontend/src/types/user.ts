export interface User {
  id: string;
  username?: string;
  email: string;
  role: string;
  store?: string | null;
  created_at: string;
}

export interface UserCreateFormData {
  username: string;
  email: string;
  password: string;
  role: string;
  store: string | null;
}

export interface UserEditFormData {
  username: string;
  email: string;
  role: string;
  password: string;
  store: string | null;
}

export const USER_ROLES = ['Cast', 'Staff', 'Manager', 'Admin'] as const;

export const USER_ROLE_LABELS: Record<string, string> = {
  Cast: 'キャスト',
  Staff: 'スタッフ',
  Manager: 'マネージャー',
  Admin: '管理者',
};
