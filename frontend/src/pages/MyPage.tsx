import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ERROR_MESSAGES } from '../utils/errorMessages';
import { API } from '../config';

const inputClass =
  'mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-800 shadow-sm focus:border-sakura-300 focus:ring-1 focus:ring-sakura-300 text-sm';
const labelClass = 'block text-sm font-medium text-gray-700';

// Placeholder dashboard data
const PLACEHOLDER_GOAL = { label: '今月の売上目標', value: '500,000', unit: '円', rate: 75 };
const PLACEHOLDER_SALES = [
  { label: '1月', value: 320 },
  { label: '2月', value: 380 },
  { label: '3月', value: 410 },
  { label: '4月', value: 350 },
  { label: '5月', value: 480 },
  { label: '6月', value: 420 },
];

export default function MyPage() {
  const { user, updateStoredUser } = useAuth();
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!user) return null;

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!newEmail.trim()) return;
    setSaving(true);
    try {
      await axios.patch(`${API}/users/${user.user_id}/`, { email: newEmail.trim() });
      updateStoredUser({ email: newEmail.trim() });
      setSuccess('メールアドレスを変更しました。');
      setNewEmail('');
      setEmailModalOpen(false);
    } catch {
      setError(ERROR_MESSAGES.change);
    }
    setSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (newPassword !== confirmPassword) {
      setError('パスワードが一致しません。もう一度ご確認ください。');
      return;
    }
    if (newPassword.length < 1) {
      setError(ERROR_MESSAGES.invalidInput);
      return;
    }
    setSaving(true);
    try {
      await axios.patch(`${API}/users/${user.user_id}/`, { password: newPassword });
      setSuccess('パスワードを変更しました。');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordModalOpen(false);
    } catch {
      setError(ERROR_MESSAGES.change);
    }
    setSaving(false);
  };

  const maxBar = Math.max(...PLACEHOLDER_SALES.map((s) => s.value));

  return (
    <div className="min-h-screen bg-washi">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-xl sm:text-2xl font-medium text-gray-800 tracking-tight">マイページ</h1>
        <p className="mt-1 text-sm text-gray-500">{user.email} · {user.role}</p>

        {success && (
          <div className="mt-4 rounded-lg bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-800">
            {success}
          </div>
        )}

        {/* Dashboard: goals & sales placeholder */}
        <section className="mt-6 rounded-2xl border border-gray-100 bg-white shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-sakura-50/50">
            <h2 className="text-sm font-medium text-gray-700">ダッシュボード</h2>
          </div>
          <div className="p-5 space-y-6">
            <div className="rounded-xl bg-sakura-50/50 border border-sakura-100 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-700">{PLACEHOLDER_GOAL.label}</span>
                <span className="text-lg font-semibold text-gray-900">{PLACEHOLDER_GOAL.value} {PLACEHOLDER_GOAL.unit}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-sakura-400 transition-all"
                  style={{ width: `${PLACEHOLDER_GOAL.rate}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">達成率 {PLACEHOLDER_GOAL.rate}%</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">売上推移（サンプル）</h3>
              <div className="flex items-end gap-2 h-44">
                {PLACEHOLDER_SALES.map((s) => (
                  <div key={s.label} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium text-gray-600">{s.value}</span>
                    <div className="w-full rounded-t bg-sakura-200 min-h-[0.5rem]" style={{ height: `${(s.value / maxBar) * 100}%` }} />
                    <span className="text-xs text-gray-500">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Account settings */}
        <section className="mt-6 rounded-2xl border border-gray-100 bg-white shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/80">
            <h2 className="text-sm font-medium text-gray-700">アカウント設定</h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 py-2">
              <div>
                <p className="text-sm font-medium text-gray-700">メールアドレス</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={() => { setEmailModalOpen(true); setError(null); setNewEmail(user.email); }}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                メールアドレスを変更
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 py-2 border-t border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-700">パスワード</p>
                <p className="text-sm text-gray-500">••••••••</p>
              </div>
              <button
                type="button"
                onClick={() => { setPasswordModalOpen(true); setError(null); setNewPassword(''); setConfirmPassword(''); }}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                パスワードを変更
              </button>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <p className="text-sm text-gray-500">権限（ロール）の変更は管理者のみ行えます。</p>
            </div>
          </div>
        </section>

        {/* Email change modal */}
        {emailModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => setEmailModalOpen(false)}>
            <div className="w-full max-w-md rounded-2xl bg-white shadow-lg border border-gray-100 p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-medium text-gray-800 border-b border-gray-100 pb-3">メールアドレスを変更</h2>
              {error && <div className="mt-3 rounded-lg bg-red-50 border border-red-100 px-4 py-2 text-sm text-red-700">{error}</div>}
              <form onSubmit={handleChangeEmail} className="mt-4 space-y-4">
                <div>
                  <label className={labelClass}>新しいメールアドレス</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className={inputClass}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-sakura-400 text-white text-sm font-medium hover:bg-sakura-500 disabled:opacity-60">
                    {saving ? '変更中…' : '変更する'}
                  </button>
                  <button type="button" className="px-4 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50" onClick={() => setEmailModalOpen(false)}>キャンセル</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Password change modal */}
        {passwordModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => setPasswordModalOpen(false)}>
            <div className="w-full max-w-md rounded-2xl bg-white shadow-lg border border-gray-100 p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-medium text-gray-800 border-b border-gray-100 pb-3">パスワードを変更</h2>
              {error && <div className="mt-3 rounded-lg bg-red-50 border border-red-100 px-4 py-2 text-sm text-red-700">{error}</div>}
              <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
                <div>
                  <label className={labelClass}>新しいパスワード</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inputClass}
                    required
                    minLength={1}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className={labelClass}>新しいパスワード（確認）</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                    required
                    minLength={1}
                    autoComplete="new-password"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-sakura-400 text-white text-sm font-medium hover:bg-sakura-500 disabled:opacity-60">
                    {saving ? '変更中…' : '変更する'}
                  </button>
                  <button type="button" className="px-4 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50" onClick={() => setPasswordModalOpen(false)}>キャンセル</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
