import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import type { Store } from '../types/customer';
import type { LoginResponse } from '../types/auth';

const API = '/api';
const inputClass =
  'mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-800 shadow-sm focus:border-sakura-300 focus:ring-1 focus:ring-sakura-300 text-sm';
const labelClass = 'block text-sm font-medium text-gray-700';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeId, setStoreId] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { loginWithResponse } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get<Store[]>(`${API}/stores/`)
      .then((res) => setStores(res.data))
      .catch(() => setStores([]))
      .finally(() => setStoresLoading(false));
  }, []);

  const noStores = !storesLoading && stores.length === 0;
  const storeRequired = !noStores;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (storeRequired && !storeId.trim()) {
      setError('店舗を選択してください。');
      return;
    }
    setSubmitting(true);
    try {
      const payload: { username: string; email: string; password: string; store?: string } = {
        username: username.trim(),
        email: email.trim(),
        password,
      };
      if (storeId.trim()) payload.store = storeId;
      const res = await axios.post<LoginResponse>(`${API}/auth/register/`, payload);
      loginWithResponse(res.data);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.detail ?? err.message)
        : '登録に失敗しました。';
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-washi flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-card border border-gray-100 p-8">
        <h1 className="text-xl font-medium text-gray-800 text-center">新規登録</h1>
        <p className="mt-1 text-sm text-gray-500 text-center">
          初回は管理者として登録されます。既に管理者がいる場合はキャストとして登録されます。
        </p>

        {storesLoading ? (
          <p className="mt-6 text-sm text-gray-500 text-center">店舗を読み込み中…</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {noStores && (
              <div className="rounded-lg bg-sky-50 border border-sky-100 px-4 py-3 text-sm text-sky-800">
                管理者として登録します。店舗はログイン後に登録できます。
              </div>
            )}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="reg-username" className={labelClass}>
                ユーザー名（任意）
              </label>
              <input
                id="reg-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClass}
                placeholder="表示名"
              />
            </div>
            <div>
              <label htmlFor="reg-email" className={labelClass}>
                メールアドレス *
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="reg-password" className={labelClass}>
                パスワード *
              </label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                required
                minLength={1}
              />
            </div>
            {!noStores && (
              <div>
                <label htmlFor="reg-store" className={labelClass}>
                  店舗 *
                </label>
                <select
                  id="reg-store"
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  className={inputClass}
                  required
                >
                  <option value="">選択してください</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-sakura-400 text-white text-sm font-medium shadow-soft hover:bg-sakura-500 disabled:opacity-60 transition-colors"
            >
              {submitting ? '登録中…' : '登録'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          すでにアカウントをお持ちの方は{' '}
          <Link to="/login" className="text-sakura-600 hover:underline">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
