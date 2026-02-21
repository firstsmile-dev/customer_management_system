import React, { useState, useEffect } from 'react';
import axios from 'axios';
import type { StaffMember, StaffMemberFormData } from '../types/staffMember';
import type { Store } from '../types/customer';
import type { User } from '../types/user';

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

function formatDateTime(s: string) {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'short' });
}

function toFormData(m: StaffMember): StaffMemberFormData {
  return {
    user: m.user,
    store: m.store,
    hourly_wage: m.hourly_wage,
    commission_rate: String(m.commission_rate),
    is_on_duty: m.is_on_duty,
    check_in: m.check_in.slice(0, 16),
    check_out: m.check_out.slice(0, 16),
  };
}

function nowLocalISO() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const emptyForm = (): StaffMemberFormData => ({
  user: '',
  store: '',
  hourly_wage: '0',
  commission_rate: '0',
  is_on_duty: false,
  check_in: nowLocalISO(),
  check_out: nowLocalISO(),
});

export default function StaffMemberList() {
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<StaffMemberFormData | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<StaffMemberFormData | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = () => {
    axios.get<StaffMember[]>(`${API}/staff-members/`).then((r) => setMembers(r.data)).catch(() => setMembers([]));
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get<StaffMember[]>(`${API}/staff-members/`).then((r) => r.data).catch(() => []),
      axios.get<User[]>(`${API}/users/`).then((r) => r.data).catch(() => []),
      axios.get<Store[]>(`${API}/stores/`).then((r) => r.data).catch(() => []),
    ]).then(([m, u, s]) => {
      setMembers(m);
      setUsers(u);
      setStores(s);
    });
    setLoading(false);
  }, []);

  const userEmail = (id: string) => users.find((u) => u.id === id)?.email ?? id.slice(0, 8);
  const storeName = (id: string) => stores.find((s) => s.id === id)?.name ?? id.slice(0, 8);

  const openEdit = (m: StaffMember) => {
    setEditId(m.id);
    setEditForm(toFormData(m));
    setError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm) return;
    setSaving(true);
    setError(null);
    try {
      await axios.post(`${API}/staff-members/`, {
        ...createForm,
        hourly_wage: createForm.hourly_wage,
        commission_rate: Number(createForm.commission_rate),
        check_in: new Date(createForm.check_in).toISOString(),
        check_out: new Date(createForm.check_out).toISOString(),
      });
      fetchMembers();
      setCreateOpen(false);
      setCreateForm(null);
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : '登録に失敗しました。');
    }
    setSaving(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId || !editForm) return;
    setSaving(true);
    setError(null);
    try {
      await axios.patch(`${API}/staff-members/${editId}/`, {
        ...editForm,
        commission_rate: Number(editForm.commission_rate),
        check_in: new Date(editForm.check_in).toISOString(),
        check_out: new Date(editForm.check_out).toISOString(),
      });
      fetchMembers();
      setEditId(null);
      setEditForm(null);
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : '更新に失敗しました。');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await axios.delete(`${API}/staff-members/${id}/`);
      fetchMembers();
      setDeleteConfirmId(null);
      if (viewId === id) setViewId(null);
    } catch {
      setError('削除に失敗しました。');
    }
  };

  return (
    <div className="min-h-screen bg-sky-50/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-medium text-gray-800 tracking-tight">スタッフ・担当者管理</h1>
            <p className="mt-1 text-sm text-gray-500">スタッフの登録・閲覧・編集・削除ができます。</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-medium hover:bg-sky-600"
            onClick={() => { setCreateOpen(true); setError(null); setCreateForm(emptyForm()); }}
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
                  <th className="px-4 py-3 font-medium text-gray-700">ユーザー</th>
                  <th className="px-4 py-3 font-medium text-gray-700">店舗</th>
                  <th className="px-4 py-3 font-medium text-gray-700">時給（円）</th>
                  <th className="px-4 py-3 font-medium text-gray-700">歩合率</th>
                  <th className="px-4 py-3 font-medium text-gray-700">出勤中</th>
                  <th className="px-4 py-3 font-medium text-gray-700">出勤</th>
                  <th className="px-4 py-3 font-medium text-gray-700">退勤</th>
                  <th className="px-4 py-3 font-medium text-gray-700 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">登録がありません</td></tr>
                ) : (
                  members.map((m) => (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-sky-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{userEmail(m.user)}</td>
                      <td className="px-4 py-3 text-gray-600">{storeName(m.store)}</td>
                      <td className="px-4 py-3 text-gray-600">{m.hourly_wage}</td>
                      <td className="px-4 py-3 text-gray-600">{m.commission_rate}</td>
                      <td className="px-4 py-3 text-gray-600">{m.is_on_duty ? 'はい' : 'いいえ'}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDateTime(m.check_in)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDateTime(m.check_out)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-1 sm:gap-2 items-center">
                          <button type="button" className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 text-xs sm:text-sm" onClick={() => setViewId(m.id)}><IconView />表示</button>
                          <button type="button" className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-800 text-xs sm:text-sm" onClick={() => openEdit(m)}><IconEdit />編集</button>
                          {deleteConfirmId === m.id ? (
                            <>
                              <button type="button" className="inline-flex items-center gap-1 text-red-600 text-xs sm:text-sm font-medium" onClick={() => handleDelete(m.id)}><IconCheck />削除する</button>
                              <button type="button" className="inline-flex items-center gap-1 text-gray-500 text-xs sm:text-sm" onClick={() => setDeleteConfirmId(null)}><IconClose />キャンセル</button>
                            </>
                          ) : (
                            <button type="button" className="inline-flex items-center gap-1 text-red-500 hover:text-red-600 text-xs sm:text-sm" onClick={() => setDeleteConfirmId(m.id)}><IconDelete />削除</button>
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
          const m = members.find((x) => x.id === viewId);
          if (!m) return null;
          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => setViewId(null)}>
              <div className="w-full max-w-md rounded-2xl bg-white shadow-lg border border-gray-100 p-6" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-lg font-medium text-gray-800 border-b border-gray-100 pb-3">スタッフ情報</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  <div><dt className="text-gray-500">ユーザー</dt><dd className="font-medium">{userEmail(m.user)}</dd></div>
                  <div><dt className="text-gray-500">店舗</dt><dd>{storeName(m.store)}</dd></div>
                  <div><dt className="text-gray-500">時給（円）</dt><dd>{m.hourly_wage}</dd></div>
                  <div><dt className="text-gray-500">歩合率</dt><dd>{m.commission_rate}</dd></div>
                  <div><dt className="text-gray-500">出勤中</dt><dd>{m.is_on_duty ? 'はい' : 'いいえ'}</dd></div>
                  <div><dt className="text-gray-500">出勤</dt><dd>{formatDateTime(m.check_in)}</dd></div>
                  <div><dt className="text-gray-500">退勤</dt><dd>{formatDateTime(m.check_out)}</dd></div>
                </dl>
                <div className="mt-4 flex gap-2">
                  <button type="button" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 text-white text-sm hover:bg-sky-600" onClick={() => { setViewId(null); openEdit(m); }}><IconEdit />編集</button>
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
              <h2 className="text-lg font-medium text-gray-800 border-b border-gray-100 pb-3">スタッフを登録</h2>
              <StaffMemberForm
                form={createForm}
                setForm={setCreateForm}
                users={users}
                stores={stores}
                onSubmit={handleCreate}
                saving={saving}
                submitLabel="登録"
                onCancel={() => { setCreateOpen(false); setCreateForm(null); }}
              />
            </div>
          </div>
        )}

        {/* Edit modal */}
        {editId && editForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => { setEditId(null); setEditForm(null); }}>
            <div className="w-full max-w-md rounded-2xl bg-white shadow-lg border border-gray-100 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-medium text-gray-800 border-b border-gray-100 pb-3">スタッフを編集</h2>
              <StaffMemberForm
                form={editForm}
                setForm={setEditForm}
                users={users}
                stores={stores}
                onSubmit={handleSaveEdit}
                saving={saving}
                submitLabel="保存"
                onCancel={() => { setEditId(null); setEditForm(null); }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface StaffMemberFormProps {
  form: StaffMemberFormData;
  setForm: React.Dispatch<React.SetStateAction<StaffMemberFormData | null>>;
  users: User[];
  stores: Store[];
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  submitLabel: string;
  onCancel: () => void;
}

function StaffMemberForm({ form, setForm, users, stores, onSubmit, saving, submitLabel, onCancel }: StaffMemberFormProps) {
  const update = (patch: Partial<StaffMemberFormData>) => setForm((f) => (f ? { ...f, ...patch } : null));
  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
      <div>
        <label className={labelClass}>ユーザー *</label>
        <select value={form.user} onChange={(e) => update({ user: e.target.value })} className={inputClass} required>
          <option value="">選択してください</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.email}</option>)}
        </select>
      </div>
      <div>
        <label className={labelClass}>店舗 *</label>
        <select value={form.store} onChange={(e) => update({ store: e.target.value })} className={inputClass} required>
          <option value="">選択してください</option>
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <label className={labelClass}>時給（円） *</label>
        <input type="number" step="0.01" min="0" value={form.hourly_wage} onChange={(e) => update({ hourly_wage: e.target.value })} className={inputClass} required />
      </div>
      <div>
        <label className={labelClass}>歩合率 *</label>
        <input type="number" step="0.01" min="0" max="100" value={form.commission_rate} onChange={(e) => update({ commission_rate: e.target.value })} className={inputClass} required />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="is_on_duty" checked={form.is_on_duty} onChange={(e) => update({ is_on_duty: e.target.checked })} className="rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
        <label htmlFor="is_on_duty" className="text-sm text-gray-700">出勤中</label>
      </div>
      <div>
        <label className={labelClass}>出勤日時</label>
        <input type="datetime-local" value={form.check_in} onChange={(e) => update({ check_in: e.target.value })} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>退勤日時</label>
        <input type="datetime-local" value={form.check_out} onChange={(e) => update({ check_out: e.target.value })} className={inputClass} />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 disabled:opacity-60">
          {saving ? '送信中…' : <><IconSave />{submitLabel}</>}
        </button>
        <button type="button" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50" onClick={onCancel}><IconClose />キャンセル</button>
      </div>
    </form>
  );
}
