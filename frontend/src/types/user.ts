export interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export interface UserCreateFormData {
  email: string;
  password: string;
  role: string;
}

export interface UserEditFormData {
  email: string;
  role: string;
  password: string;
}

export const USER_ROLES = ['Cast', 'Staff', 'Manager', 'Admin'] as const;

export const USER_ROLE_LABELS: Record<string, string> = {
  Cast: 'キャスト',
  Staff: 'スタッフ',
  Manager: 'マネージャー',
  Admin: '管理者',
};
