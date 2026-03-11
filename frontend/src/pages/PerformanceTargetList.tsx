import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import type { PerformanceTarget, PerformanceTargetFormData, TargetType } from '../types/performanceTarget';
import { TARGET_TYPES } from '../types/performanceTarget';
import type { StaffMember } from '../types/staffMember';
import type { Store } from '../types/customer';
import type { User } from '../types/user';
import { ERROR_MESSAGES } from '../utils/errorMessages';
import { formatPrice } from '../utils/formatPrice';
import { API } from '../config';

const inputClass =
  'mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-800 shadow-sm focus:border-sky-300 focus:ring-1 focus:ring-sky-300 text-sm';
const labelClass = 'block text-sm font-medium text-gray-700';

const iconClass = 'w-4 h-4 shrink-0';
const IconAdd = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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

function todayISO() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const emptyForm = (firstStaffId: string): PerformanceTargetFormData => ({
  staff: firstStaffId,
  target_amount: '0',
  target_type: 'Monthly',
  target_date: todayISO(),
});

function toFormData(t: PerformanceTarget): PerformanceTargetFormData {
  const n = Number(t.target_amount);
  const amount = Number.isNaN(n) ? '0' : String(Math.round(n));
  return {
    staff: t.staff,
    target_amount: amount,
    target_type: t.target_type,
    target_date: t.target_date,
  };
}


export default function PerformanceTargetList() {
  const { user } = useAuth();
  const [targets, setTargets] = useState<PerformanceTarget[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<PerformanceTargetFormData | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PerformanceTargetFormData | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTargets = () => {
    axios.get<PerformanceTarget[]>(`${API}/performance-targets/`).then((r) => setTargets(r.data)).catch(() => setTargets([]));
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get<PerformanceTarget[]>(`${API}/performance-targets/`).then((r) => r.data).catch(() => []),
      axios.get<StaffMember[]>(`${API}/staff-members/`).then((r) => r.data).catch(() => []),
      axios.get<Store[]>(`${API}/stores/`).then((r) => r.data).catch(() => []),
      axios.get<User[]>(`${API}/users/`).then((r) => r.data).catch(() => []),
    ]).then(([t, s, st, u]) => {
      setTargets(t);
      setStaff(s);
      setStores(st);
      setUsers(u);
    });
    setLoading(false);
  }, []);

  /** Staff members that belong to the current user (Cast: own only). */
  const myStaff = useMemo(() => {
    if (!user?.user_id) return [];
    return staff.filter((s) => s.user === user.user_id);
  }, [staff, user?.user_id]);

  /** Staff options in create/edit: Cast = own staff only; Staff/Manager/Admin = all staff in their scope. */
  const staffOptions = useMemo(() => {
    return user?.role === 'Cast' ? myStaff : staff;
  }, [user?.role, myStaff, staff]);

  const storeName = (id: string) => stores.find((s) => s.id === id)?.name ?? id.slice(0, 8);
  const staffLabel = (staffId: string) => {
    const sm = staff.find((s) => s.id === staffId);
    if (!sm) return staffId.slice(0, 8);
    return storeName(sm.store);
  };
  const castDisplayName = (staffId: string) => {
    const sm = staff.find((s) => s.id === staffId);
    if (!sm) return '—';
    const u = users.find((x) => x.id === sm.user);
    if (!u) return sm.id.slice(0, 8);
    return (u.username && u.username.trim()) ? u.username : u.email;
  };
  const isCast = user?.role === 'Cast';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm) return;
    setSaving(true);
    setError(null);
    try {
      await axios.post(`${API}/performance-targets/`, {
        staff: createForm.staff,
        target_amount: Math.round(Number(createForm.target_amount)) || 0,
        target_type: createForm.target_type,
        target_date: createForm.target_date,
      });
      fetchTargets();
      setCreateOpen(false);
      setCreateForm(null);
    } catch {
      setError(ERROR_MESSAGES.create);
    }
    setSaving(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId || !editForm) return;
    setSaving(true);
    setError(null);
    try {
      await axios.patch(`${API}/performance-targets/${editId}/`, {
        staff: editForm.staff,
        target_amount: Math.round(Number(editForm.target_amount)) || 0,
        target_type: editForm.target_type,
        target_date: editForm.target_date,
      });
      fetchTargets();
      setEditId(null);
      setEditForm(null);
    } catch {
      setError(ERROR_MESSAGES.update);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await axios.delete(`${API}/performance-targets/${id}/`);
      fetchTargets();
      setDeleteConfirmId(null);
    } catch {
      setError(ERROR_MESSAGES.delete);
    }
  };

  const openCreate = () => {
    const firstId = staffOptions[0]?.id ?? '';
    setCreateForm(emptyForm(firstId));
    setCreateOpen(true);
    setError(null);
  };

  const openEdit = (t: PerformanceTarget) => {
    setEditId(t.id);
    setEditForm(toFormData(t));
    setError(null);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-sky-50/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-medium text-gray-800 tracking-tight">売上目標</h1>
            <p className="mt-1 text-sm text-gray-500">
              {isCast ? '自分の目標を登録・編集・削除' : '担当店舗内のキャストの目標を一覧・登録・編集・削除'}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={openCreate}
            disabled={staffOptions.length === 0}
            title={staffOptions.length === 0 ? (isCast ? 'スタッフ登録がありません。スタッフ管理で自分を店舗に登録してください。' : '担当店舗にスタッフが登録されていません。') : ''}
          >
            <IconAdd /> 新規登録
          </button>
        </div>

        {staffOptions.length === 0 && (
          <div className="mt-4 rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-800">
            {isCast
              ? '目標を登録するには、スタッフ管理でご自身を店舗に登録する必要があります。'
              : '担当店舗にスタッフが登録されていません。スタッフ管理でキャストを登録してください。'}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="mt-8 text-gray-500">読み込み中…</p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-gray-100 bg-white/90 shadow-sm">
            <table className="w-full min-w-max text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="px-2 sm:px-4 py-3 font-medium text-gray-700 whitespace-nowrap">店舗</th>
                  {!isCast && <th className="px-2 sm:px-4 py-3 font-medium text-gray-700 whitespace-nowrap">担当</th>}
                  <th className="px-2 sm:px-4 py-3 font-medium text-gray-700 whitespace-nowrap">種別</th>
                  <th className="px-2 sm:px-4 py-3 font-medium text-gray-700 whitespace-nowrap">目標日</th>
                  <th className="px-2 sm:px-4 py-3 font-medium text-gray-700 whitespace-nowrap">目標額（円）</th>
                  <th className="px-2 sm:px-4 py-3 font-medium text-gray-700 text-right whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody>
                {targets.length === 0 ? (
                  <tr>
                    <td colSpan={isCast ? 5 : 6} className="px-4 py-8 text-center text-gray-500">
                      目標がありません
                    </td>
                  </tr>
                ) : (
                  targets.map((t) => (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-sky-50/50">
                      <td className="px-2 sm:px-4 py-3 text-gray-900 whitespace-nowrap">{staffLabel(t.staff)}</td>
                      {!isCast && <td className="px-2 sm:px-4 py-3 text-gray-600 whitespace-nowrap">{castDisplayName(t.staff)}</td>}
                      <td className="px-2 sm:px-4 py-3 text-gray-600 whitespace-nowrap">{t.target_type === 'Daily' ? '日次' : '月次'}</td>
                      <td className="px-2 sm:px-4 py-3 text-gray-600 whitespace-nowrap">{t.target_date}</td>
                      <td className="px-2 sm:px-4 py-3 text-gray-600 whitespace-nowrap">{formatPrice(t.target_amount)} 円</td>
                      <td className="px-2 sm:px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex flex-wrap justify-end gap-1 sm:gap-2 items-center">
                          <button type="button" className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-800 text-xs sm:text-sm" onClick={() => openEdit(t)}>
                            <IconEdit /> 編集
                          </button>
                          {deleteConfirmId === t.id ? (
                            <>
                              <button type="button" className="inline-flex items-center gap-1 text-red-600 text-xs sm:text-sm font-medium" onClick={() => handleDelete(t.id)}>
                                <IconCheck /> 削除する
                              </button>
                              <button type="button" className="inline-flex items-center gap-1 text-gray-500 text-xs sm:text-sm" onClick={() => setDeleteConfirmId(null)}>
                                <IconClose /> キャンセル
                              </button>
                            </>
                          ) : (
                            <button type="button" className="inline-flex items-center gap-1 text-red-500 hover:text-red-600 text-xs sm:text-sm" onClick={() => setDeleteConfirmId(t.id)}>
                              <IconDelete /> 削除
                            </button>
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

        {/* Create modal */}
        {createOpen && createForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => { setCreateOpen(false); setCreateForm(null); }}>
            <div className="w-full max-w-md rounded-2xl bg-white shadow-lg border border-gray-100 p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-medium text-gray-800 border-b border-gray-100 pb-3">目標を登録</h2>
              <PerformanceTargetForm
                form={createForm}
                setForm={setCreateForm}
                staffOptions={staffOptions}
                staffLabel={staffLabel}
                isCast={isCast}
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
            <div className="w-full max-w-md rounded-2xl bg-white shadow-lg border border-gray-100 p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-medium text-gray-800 border-b border-gray-100 pb-3">目標を編集</h2>
              <PerformanceTargetForm
                form={editForm}
                setForm={setEditForm}
                staffOptions={staffOptions}
                staffLabel={staffLabel}
                isCast={isCast}
                onSubmit={handleUpdate}
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

interface PerformanceTargetFormProps {
  form: PerformanceTargetFormData;
  setForm: React.Dispatch<React.SetStateAction<PerformanceTargetFormData | null>>;
  staffOptions: StaffMember[];
  staffLabel: (staffId: string) => string;
  isCast: boolean;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  submitLabel: string;
  onCancel: () => void;
}

function PerformanceTargetForm({ form, setForm, staffOptions, staffLabel, isCast, onSubmit, saving, submitLabel, onCancel }: PerformanceTargetFormProps) {
  const update = (patch: Partial<PerformanceTargetFormData>) => setForm((f) => (f ? { ...f, ...patch } : null));
  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
      <div>
        <label className={labelClass}>{isCast ? '店舗（自分）' : '担当（キャスト）'} *</label>
        <select value={form.staff} onChange={(e) => update({ staff: e.target.value })} className={inputClass} required>
          <option value="">選択してください</option>
          {staffOptions.map((s) => (
            <option key={s.id} value={s.id}>{staffLabel(s.id)}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>種別 *</label>
        <select value={form.target_type} onChange={(e) => update({ target_type: e.target.value as TargetType })} className={inputClass} required>
          {TARGET_TYPES.map((tt) => (
            <option key={tt} value={tt}>{tt === 'Daily' ? '日次' : '月次'}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>目標日 *</label>
        <input type="date" value={form.target_date} onChange={(e) => update({ target_date: e.target.value })} className={inputClass} required />
      </div>
      <div>
        <label className={labelClass}>目標額（円） *</label>
        <input type="number" step="1" min="0" value={form.target_amount} onChange={(e) => update({ target_amount: e.target.value })} className={inputClass} required />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 disabled:opacity-60">
          {saving ? '送信中…' : <><IconSave />{submitLabel}</>}
        </button>
        <button type="button" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50" onClick={onCancel}>
          <IconClose /> キャンセル
        </button>
      </div>
    </form>
  );
}
