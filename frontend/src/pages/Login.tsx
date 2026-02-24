import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const inputClass =
  'mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-800 shadow-sm focus:border-sakura-300 focus:ring-1 focus:ring-sakura-300 text-sm';
const labelClass = 'block text-sm font-medium text-gray-700';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await login(email.trim(), password);
    setSubmitting(false);
    if (result.ok) {
      navigate(next, { replace: true });
    } else {
      setError(result.error ?? 'ログインに失敗しました。');
    }
  };

  return (
    <div className="min-h-screen bg-washi flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-card border border-gray-100 p-8">
        <h1 className="text-xl font-medium text-gray-800 text-center">ログイン</h1>
        <p className="mt-1 text-sm text-gray-500 text-center">メールアドレスとパスワードを入力してください</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="login-email" className={labelClass}>
              メールアドレス
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label htmlFor="login-password" className={labelClass}>
              パスワード
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-sakura-400 text-white text-sm font-medium shadow-soft hover:bg-sakura-500 disabled:opacity-60 transition-colors"
          >
            {submitting ? 'ログイン中…' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
}
