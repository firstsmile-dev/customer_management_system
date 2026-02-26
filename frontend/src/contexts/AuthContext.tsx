import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import type { AuthUser, LoginResponse } from '../types/auth';

const API = '/api';
const STORAGE_ACCESS = 'cms_access';
const STORAGE_REFRESH = 'cms_refresh';
const STORAGE_USER = 'cms_user';

/** Paths allowed per role. Admin can access all. */
const ROLE_PATHS: Record<string, string[]> = {
  Cast: ['/', '/customers', '/customers/register', '/visit-records', '/my-page'],
  Staff: ['/', '/customers', '/customers/register', '/visit-records', '/daily-sales', '/daily-expenses', '/staff-members', '/my-page'],
  Manager: ['/', '/customers', '/customers/register', '/visit-records', '/daily-sales', '/daily-expenses', '/staff-members', '/stores', '/my-page'],
  Admin: ['/', '/customers', '/customers/register', '/visit-records', '/daily-sales', '/daily-expenses', '/stores', '/users', '/staff-members', '/my-page'],
};

function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_USER);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      ...parsed,
      store_id: parsed.store_id ?? null,
      store_name: parsed.store_name ?? null,
    } as AuthUser;
  } catch {
    return null;
  }
}

function setAxiosAuth(access: string | null) {
  if (access) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
}

function clearStorage() {
  localStorage.removeItem(STORAGE_ACCESS);
  localStorage.removeItem(STORAGE_REFRESH);
  localStorage.removeItem(STORAGE_USER);
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  /** Set auth from a login/register API response (e.g. after registration). */
  loginWithResponse: (data: LoginResponse) => void;
  logout: () => void;
  isAllowed: (path: string) => boolean;
  /** Update stored user (e.g. after email change). Persists to localStorage. */
  updateStoredUser: (patch: Partial<Pick<AuthUser, 'email' | 'username' | 'store_id' | 'store_name'>>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearStorage();
    setAxiosAuth(null);
    setUser(null);
  }, []);

  const loginWithResponse = useCallback((data: LoginResponse) => {
    const authUser: AuthUser = {
      user_id: data.user_id,
      username: data.username ?? '',
      email: data.email,
      role: data.role,
      store_id: data.store_id ?? null,
      store_name: data.store_name ?? null,
    };
    localStorage.setItem(STORAGE_ACCESS, data.access);
    localStorage.setItem(STORAGE_REFRESH, data.refresh);
    localStorage.setItem(STORAGE_USER, JSON.stringify(authUser));
    setAxiosAuth(data.access);
    setUser(authUser);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await axios.post<LoginResponse>(`${API}/auth/login/`, { email, password });
      loginWithResponse(res.data);
      return { ok: true };
    } catch {
      return { ok: false, error: 'ログインに失敗しました。メールアドレスとパスワードをご確認ください。' };
    }
  }, []);

  const isAllowed = useCallback((path: string) => {
    if (!user) return false;
    const normalized = path.replace(/\/$/, '') || '/';
    const allowed = ROLE_PATHS[user.role];
    if (!allowed) return false;
    if (user.role === 'Admin') return true;
    return allowed.some((p) => p === normalized || normalized.startsWith(p + '/'));
  }, [user]);

  const updateStoredUser = useCallback((patch: Partial<Pick<AuthUser, 'email' | 'username' | 'store_id' | 'store_name'>>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_USER, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const access = localStorage.getItem(STORAGE_ACCESS);
    const u = getStoredUser();
    if (access && u) {
      setAxiosAuth(access);
      setUser(u);
    } else {
      clearStorage();
      setAxiosAuth(null);
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (res) => res,
      async (err) => {
        const original = err.config;
        if (err.response?.status === 401 && !original._retry) {
          original._retry = true;
          const refresh = localStorage.getItem(STORAGE_REFRESH);
          if (refresh) {
            try {
              const res = await axios.post<{ access: string }>(`${API}/auth/refresh/`, { refresh });
              localStorage.setItem(STORAGE_ACCESS, res.data.access);
              setAxiosAuth(res.data.access);
              original.headers['Authorization'] = `Bearer ${res.data.access}`;
              return axios(original);
            } catch {
              logout();
              window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
              return Promise.reject(err);
            }
          }
          logout();
          window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [logout]);

  const value: AuthContextValue = { user, loading, login, loginWithResponse, logout, isAllowed, updateStoredUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
