import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ERROR_MESSAGES } from '../utils/errorMessages';
import { API } from '../config';
import type { PerformanceTarget, PerformanceTargetFormData, TargetType } from '../types/performanceTarget';
import { TARGET_TYPES } from '../types/performanceTarget';
import type { StaffMember } from '../types/staffMember';
import type { Store } from '../types/customer';

const inputClass =
  'mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-800 shadow-sm focus:border-sakura-300 focus:ring-1 focus:ring-sakura-300 text-sm';
const labelClass = 'block text-sm font-medium text-gray-700';

function todayISO() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

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

const emptyTargetForm = (firstStaffId: string): PerformanceTargetFormData => ({
  staff: firstStaffId,
  target_amount: '0',
  target_type: 'Monthly',
  target_date: todayISO(),
});

function formatAmount(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(n)) return '—';
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

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

  // Cast: own sales targets (performance_targets) on My Page
  const [targets, setTargets] = useState<PerformanceTarget[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [targetsLoading, setTargetsLoading] = useState(false);
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [targetForm, setTargetForm] = useState<PerformanceTargetFormData | null>(null);
  const [targetEditId, setTargetEditId] = useState<string | null>(null);
  const [targetDeleteId, setTargetDeleteId] = useState<string | null>(null);
  const [targetSaving, setTargetSaving] = useState(false);
  const [targetError, setTargetError] = useState<string | null>(null);

  const isCast = user?.role === 'Cast';

  const fetchTargets = () => {
    if (!isCast) return;
    axios.get<PerformanceTarget[]>(`${API}/performance-targets/`).then((r) => setTargets(r.data)).catch(() => setTargets([]));
  };

  useEffect(() => {
    if (!isCast) return;
    setTargetsLoading(true);
    Promise.all([
      axios.get<PerformanceTarget[]>(`${API}/performance-targets/`).then((r) => r.data).catch(() => []),
      axios.get<StaffMember[]>(`${API}/staff-members/`).then((r) => r.data).catch(() => []),
      axios.get<Store[]>(`${API}/stores/`).then((r) => r.data).catch(() => []),
    ]).then(([t, s, st]) => {
      setTargets(t);
      setStaff(s);
      setStores(st);
    }).finally(() => setTargetsLoading(false));
  }, [isCast]);

  const myStaff = useMemo(() => {
    if (!user?.user_id) return [];
    return staff.filter((s) => s.user === user.user_id);
  }, [staff, user?.user_id]);

  const storeName = (id: string) => stores.find((s) => s.id === id)?.name ?? id.slice(0, 8);
  const staffLabel = (staffId: string) => {
    const sm = staff.find((s) => s.id === staffId);
    if (!sm) return staffId.slice(0, 8);
    return storeName(sm.store);
  };

  const openAddTarget = () => {
    setTargetForm(emptyTargetForm(myStaff[0]?.id ?? ''));
    setTargetEditId(null);
    setTargetModalOpen(true);
    setTargetError(null);
  };

  const openEditTarget = (t: PerformanceTarget) => {
    setTargetForm({
      staff: t.staff,
      target_amount: t.target_amount,
      target_type: t.target_type,
      target_date: t.target_date,
    });
    setTargetEditId(t.id);
    setTargetModalOpen(true);
    setTargetError(null);
  };

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetForm) return;
    setTargetSaving(true);
    setTargetError(null);
    try {
      if (targetEditId) {
        await axios.patch(`${API}/performance-targets/${targetEditId}/`, targetForm);
      } else {
        await axios.post(`${API}/performance-targets/`, targetForm);
      }
      fetchTargets();
      setTargetModalOpen(false);
      setTargetForm(null);
      setTargetEditId(null);
    } catch {
      setTargetError(ERROR_MESSAGES.update);
    }
    setTargetSaving(false);
  };

  const handleDeleteTarget = async (id: string) => {
    setTargetError(null);
    try {
      await axios.delete(`${API}/performance-targets/${id}/`);
      fetchTargets();
      setTargetDeleteId(null);
    } catch {
      setTargetError(ERROR_MESSAGES.delete);
    }
  };

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

        {/* Cast: 売上目標 (own sales targets) */}
        {isCast && (
          <section className="mt-6 rounded-2xl border border-gray-100 bg-white shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-sakura-50/50 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-gray-700">売上目標</h2>
              <button
                type="button"
                onClick={openAddTarget}
                disabled={myStaff.length === 0}
                className="px-3 py-1.5 rounded-lg bg-sakura-400 text-white text-sm font-medium hover:bg-sakura-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                目標を追加
              </button>
            </div>
            <div className="p-5">
              {targetError && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-2 text-sm text-red-700">{targetError}</div>
              )}
              {myStaff.length === 0 ? (
                <p className="text-sm text-gray-500">目標を登録するには、スタッフ管理でご自身を店舗に登録する必要があります。</p>
              ) : targetsLoading ? (
                <p className="text-sm text-gray-500">読み込み中…</p>
              ) : targets.length === 0 ? (
                <p className="text-sm text-gray-500">目標がありません。「目標を追加」から登録してください。</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="py-2 pr-4 font-medium text-gray-700 whitespace-nowrap">店舗</th>
                        <th className="py-2 pr-4 font-medium text-gray-700 whitespace-nowrap">種別</th>
                        <th className="py-2 pr-4 font-medium text-gray-700 whitespace-nowrap">目標日</th>
                        <th className="py-2 pr-4 font-medium text-gray-700 whitespace-nowrap">目標額</th>
                        <th className="py-2 text-right font-medium text-gray-700 whitespace-nowrap">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {targets.map((t) => (
                        <tr key={t.id} className="border-b border-gray-50">
                          <td className="py-2 pr-4 text-gray-900 whitespace-nowrap">{staffLabel(t.staff)}</td>
                          <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">{t.target_type === 'Daily' ? '日次' : '月次'}</td>
                          <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">{t.target_date}</td>
                          <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">{formatAmount(t.target_amount)} 円</td>
                          <td className="py-2 text-right whitespace-nowrap">
                            <button type="button" className="text-sakura-600 hover:underline text-xs mr-2" onClick={() => openEditTarget(t)}>編集</button>
                            {targetDeleteId === t.id ? (
                              <>
                                <button type="button" className="text-red-600 font-medium text-xs mr-1" onClick={() => handleDeleteTarget(t.id)}>削除する</button>
                                <button type="button" className="text-gray-500 text-xs" onClick={() => setTargetDeleteId(null)}>キャンセル</button>
                              </>
                            ) : (
                              <button type="button" className="text-red-500 hover:underline text-xs" onClick={() => setTargetDeleteId(t.id)}>削除</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

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

        {/* Cast: 売上目標 add/edit modal */}
        {isCast && targetModalOpen && targetForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => { setTargetModalOpen(false); setTargetForm(null); setTargetEditId(null); }}>
            <div className="w-full max-w-md rounded-2xl bg-white shadow-lg border border-gray-100 p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-medium text-gray-800 border-b border-gray-100 pb-3">{targetEditId ? '目標を編集' : '目標を追加'}</h2>
              {targetError && <div className="mt-3 rounded-lg bg-red-50 border border-red-100 px-4 py-2 text-sm text-red-700">{targetError}</div>}
              <form onSubmit={handleSaveTarget} className="mt-4 space-y-4">
                <div>
                  <label className={labelClass}>店舗 *</label>
                  <select value={targetForm.staff} onChange={(e) => setTargetForm((f) => f ? { ...f, staff: e.target.value } : null)} className={inputClass} required>
                    <option value="">選択してください</option>
                    {myStaff.map((s) => (
                      <option key={s.id} value={s.id}>{staffLabel(s.id)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>種別 *</label>
                  <select value={targetForm.target_type} onChange={(e) => setTargetForm((f) => f ? { ...f, target_type: e.target.value as TargetType } : null)} className={inputClass} required>
                    {TARGET_TYPES.map((tt) => (
                      <option key={tt} value={tt}>{tt === 'Daily' ? '日次' : '月次'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>目標日 *</label>
                  <input type="date" value={targetForm.target_date} onChange={(e) => setTargetForm((f) => f ? { ...f, target_date: e.target.value } : null)} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>目標額（円） *</label>
                  <input type="number" step="0.01" min="0" value={targetForm.target_amount} onChange={(e) => setTargetForm((f) => f ? { ...f, target_amount: e.target.value } : null)} className={inputClass} required />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={targetSaving} className="px-4 py-2 rounded-xl bg-sakura-400 text-white text-sm font-medium hover:bg-sakura-500 disabled:opacity-60">
                    {targetSaving ? '保存中…' : targetEditId ? '保存' : '追加'}
                  </button>
                  <button type="button" className="px-4 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50" onClick={() => { setTargetModalOpen(false); setTargetForm(null); setTargetEditId(null); }}>キャンセル</button>
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
