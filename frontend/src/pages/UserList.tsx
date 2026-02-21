import React, { useState, useEffect } from 'react';
import axios from 'axios';
import type { User, UserCreateFormData, UserEditFormData } from '../types/user';
import { USER_ROLES, USER_ROLE_LABELS } from '../types/user';

const API = '/api';

const inputClass =
  'mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-800 shadow-sm focus:border-sky-300 focus:ring-1 focus:ring-sky-300 text-sm';
const labelClass = 'block text-sm font-medium text-gray-700';

const iconClass = 'w-4 h-4 shrink-0 inline-block align-middle';

const IconView = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const IconEdit = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const IconDelete = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const IconCheck = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);
const IconClose = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const IconSave = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);
const IconAdd = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

function formatDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UserEditFormData | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<UserCreateFormData | null>(null);
  const [deactivateConfirmId, setDeactivateConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = () => {
    axios.get<User[]>(`${API}/users/`).then((res) => setUsers(res.data)).catch(() => setUsers([]));
  };

  useEffect(() => {
    setLoading(true);
    fetchUsers();
    setLoading(false);
  }, []);

  const openEdit = (u: User) => {
    setEditId(u.id);
    setEditForm({
      email: u.email,
      role: u.role,
      password: '',
    });
    setError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm) return;
    setSaving(true);
    setError(null);
    try {
      await axios.post(`${API}/users/`, {
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
      });
      fetchUsers();
      setCreateOpen(false);
      setCreateForm(null);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? (err.response?.data?.email?.[0] ?? err.response?.data?.detail ?? err.message) : '登録に失敗しました。';
      setError(String(msg));
    }
    setSaving(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId || !editForm) return;
    setSaving(true);
    setError(null);
    try {
      const payload: { email: string; role: string; password?: string } = {
        email: editForm.email,
        role: editForm.role,
      };
      if (editForm.password.trim()) payload.password = editForm.password;
      await axios.patch(`${API}/users/${editId}/`, payload);
      fetchUsers();
      setEditId(null);
      setEditForm(null);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? (err.response?.data?.email?.[0] ?? err.response?.data?.detail ?? err.message) : '更新に失敗しました。';
      setError(String(msg));
    }
    setSaving(false);
  };

  const handleDeactivate = async (id: string) => {
    setError(null);
    try {
      await axios.delete(`${API}/users/${id}/`);
      fetchUsers();
      setDeactivateConfirmId(null);
      if (viewId === id) setViewId(null);
    } catch {
      setError('無効化に失敗しました。');
    }
  };

  const emptyCreateForm = (): UserCreateFormData => ({
    email: '',
    password: '',
    role: USER_ROLES[0],
  });

  return (
    <div className="min-h-screen bg-sky-50/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-medium text-gray-800 tracking-tight">ユーザー管理</h1>
            <p className="mt-1 text-sm text-gray-500">キャスト・スタッフ・マネージャー・管理者の登録・編集・無効化ができます。</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-medium hover:bg-sky-600"
            onClick={() => { setCreateOpen(true); setError(null); setCreateForm(emptyCreateForm()); }}
          >
            <IconAdd /> 新規登録
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="mt-8 text-gray-500">読み込み中…</p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-gray-100 bg-white/90 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="px-4 py-3 font-medium text-gray-700">メールアドレス</th>
                  <th className="px-4 py-3 font-medium text-gray-700">権限</th>
                  <th className="px-4 py-3 font-medium text-gray-700">登録日</th>
                  <th className="px-4 py-3 font-medium text-gray-700 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">登録がありません</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-sky-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{u.email}</td>
                      <td className="px-4 py-3 text-gray-600">{USER_ROLE_LABELS[u.role] ?? u.role}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(u.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-1 sm:gap-2 items-center">
                          <button type="button" className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 text-xs sm:text-sm" onClick={() => setViewId(u.id)}><IconView />表示</button>
                          <button type="button" className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-800 text-xs sm:text-sm" onClick={() => openEdit(u)}><IconEdit />編集</button>
                          {deactivateConfirmId === u.id ? (
                            <>
                              <button type="button" className="inline-flex items-center gap-1 text-red-600 text-xs sm:text-sm font-medium" onClick={() => handleDeactivate(u.id)}><IconCheck />無効化する</button>
                              <button type="button" className="inline-flex items-center gap-1 text-gray-500 text-xs sm:text-sm" onClick={() => setDeactivateConfirmId(null)}><IconClose />キャンセル</button>
                            </>
                          ) : (
                            <button type="button" className="inline-flex items-center gap-1 text-red-500 hover:text-red-600 text-xs sm:text-sm" onClick={() => setDeactivateConfirmId(u.id)}><IconDelete />無効化</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* View modal */}
        {viewId && (() => {
          const u = users.find((x) => x.id === viewId);
          if (!u) return null;
          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => setViewId(null)}>
              <div className="w-full max-w-md rounded-2xl bg-white shadow-lg border border-gray-100 p-6" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-lg font-medium text-gray-800 border-b border-gray-100 pb-3">ユーザー情報</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  <div><dt className="text-gray-500">メールアドレス</dt><dd className="font-medium">{u.email}</dd></div>
                  <div><dt className="text-gray-500">権限</dt><dd>{USER_ROLE_LABELS[u.role] ?? u.role}</dd></div>
                  <div><dt className="text-gray-500">登録日</dt><dd>{formatDate(u.created_at)}</dd></div>
                </dl>
                <div className="mt-4 flex gap-2">
                  <button type="button" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 text-white text-sm hover:bg-sky-600" onClick={() => { setViewId(null); openEdit(u); }}><IconEdit />編集</button>
                  <button type="button" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50" onClick={() => setViewId(null)}><IconClose />閉じる</button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Create modal */}
        {createOpen && createForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => { setCreateOpen(false); setCreateForm(null); }}>
            <div className="w-full max-w-md rounded-2xl bg-white shadow-lg border border-gray-100 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-medium text-gray-800 border-b border-gray-100 pb-3">ユーザーを登録</h2>
              <UserCreateForm
                form={createForm}
                setForm={setCreateForm}
                onSubmit={handleCreate}
                saving={saving}
                onCancel={() => { setCreateOpen(false); setCreateForm(null); }}
              />
            </div>
          </div>
        )}

        {/* Edit modal */}
        {editId && editForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => { setEditId(null); setEditForm(null); }}>
            <div className="w-full max-w-md rounded-2xl bg-white shadow-lg border border-gray-100 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-medium text-gray-800 border-b border-gray-100 pb-3">ユーザーを編集</h2>
              <UserEditForm
                form={editForm}
                setForm={setEditForm}
                onSubmit={handleSaveEdit}
                saving={saving}
                onCancel={() => { setEditId(null); setEditForm(null); }}
              />
            </div>
          </div>
        )}

        {/* Deactivate confirm modal */}
        {deactivateConfirmId && (() => {
          const u = users.find((x) => x.id === deactivateConfirmId);
          if (!u) return null;
          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => setDeactivateConfirmId(null)}>
              <div className="w-full max-w-sm rounded-2xl bg-white shadow-lg border border-gray-100 p-6" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-lg font-medium text-gray-800">アカウントを無効化</h2>
                <p className="mt-2 text-sm text-gray-600">
                  <strong>{u.email}</strong> のアカウントを無効化します。この操作ではアカウントが削除され、ログインできなくなります。よろしいですか？
                </p>
                <div className="mt-4 flex gap-2">
                  <button type="button" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600" onClick={() => handleDeactivate(u.id)}><IconCheck />無効化する</button>
                  <button type="button" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50" onClick={() => setDeactivateConfirmId(null)}><IconClose />キャンセル</button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

interface UserCreateFormProps {
  form: UserCreateFormData;
  setForm: React.Dispatch<React.SetStateAction<UserCreateFormData | null>>;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  onCancel: () => void;
}

function UserCreateForm({ form, setForm, onSubmit, saving, onCancel }: UserCreateFormProps) {
  const update = (patch: Partial<UserCreateFormData>) => setForm((f) => (f ? { ...f, ...patch } : null));
  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
      <div>
        <label className={labelClass}>メールアドレス *</label>
        <input type="email" value={form.email} onChange={(e) => update({ email: e.target.value })} className={inputClass} required autoComplete="email" />
      </div>
      <div>
        <label className={labelClass}>パスワード *</label>
        <input type="password" value={form.password} onChange={(e) => update({ password: e.target.value })} className={inputClass} required minLength={1} autoComplete="new-password" />
      </div>
      <div>
        <label className={labelClass}>権限 *</label>
        <select value={form.role} onChange={(e) => update({ role: e.target.value })} className={inputClass} required>
          {USER_ROLES.map((r) => <option key={r} value={r}>{USER_ROLE_LABELS[r] ?? r}</option>)}
        </select>
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 disabled:opacity-60">
          {saving ? '送信中…' : <><IconSave />登録</>}
        </button>
        <button type="button" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50" onClick={onCancel}><IconClose />キャンセル</button>
      </div>
    </form>
  );
}

interface UserEditFormProps {
  form: UserEditFormData;
  setForm: React.Dispatch<React.SetStateAction<UserEditFormData | null>>;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  onCancel: () => void;
}

function UserEditForm({ form, setForm, onSubmit, saving, onCancel }: UserEditFormProps) {
  const update = (patch: Partial<UserEditFormData>) => setForm((f) => (f ? { ...f, ...patch } : null));
  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
      <div>
        <label className={labelClass}>メールアドレス *</label>
        <input type="email" value={form.email} onChange={(e) => update({ email: e.target.value })} className={inputClass} required autoComplete="email" />
      </div>
      <div>
        <label className={labelClass}>権限 *</label>
        <select value={form.role} onChange={(e) => update({ role: e.target.value })} className={inputClass} required>
          {USER_ROLES.map((r) => <option key={r} value={r}>{USER_ROLE_LABELS[r] ?? r}</option>)}
        </select>
      </div>
      <div>
        <label className={labelClass}>新しいパスワード</label>
        <input type="password" value={form.password} onChange={(e) => update({ password: e.target.value })} className={inputClass} placeholder="変更する場合のみ入力" autoComplete="new-password" />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 disabled:opacity-60">
          {saving ? '送信中…' : <><IconSave />保存</>}
        </button>
        <button type="button" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50" onClick={onCancel}><IconClose />キャンセル</button>
      </div>
    </form>
  );
}
