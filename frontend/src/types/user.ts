export interface User {
  id: string;
  username?: string;
  email: string;
  role: string;
  store?: string | null;
  /** 統括(Supervisor)用: 閲覧可能な店舗IDの配列。管理者が設定。 */
  viewable_stores?: string[];
  created_at: string;
}

export interface UserCreateFormData {
  username: string;
  email: string;
  password: string;
  role: string;
  store: string | null;
  viewable_stores: string[];
}

export interface UserEditFormData {
  username: string;
  email: string;
  role: string;
  password: string;
  store: string | null;
  viewable_stores: string[];
}

export const USER_ROLES = ['Cast', 'Staff', 'Manager', 'Supervisor', 'Admin', 'Owner'] as const;

export const USER_ROLE_LABELS: Record<string, string> = {
  Cast: 'キャスト',
  Staff: 'スタッフ',
  Manager: 'マネージャー',
  Supervisor: '統括',
  Admin: '管理者',
  Owner: 'オーナー',
};
