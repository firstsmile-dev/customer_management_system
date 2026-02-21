import React, { useState, useEffect } from 'react';
import axios from 'axios';
import type {
  VisitRecord,
  VisitRecordFormData,
  StaffMember,
  PaymentMethod,
} from '../types/visitRecord';
import type { Customer } from '../types/customer';
import { PAYMENT_METHODS } from '../types/visitRecord';

const API = '/api';

const inputClass =
  'mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-800 shadow-sm focus:border-sky-300 focus:ring-1 focus:ring-sky-300 text-sm';
const labelClass = 'block text-sm font-medium text-gray-700';

const iconClass = 'w-4 h-4 shrink-0';

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

function nowLocalISO() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const emptyForm = (): VisitRecordFormData => ({
  customer: '',
  cast: '',
  visit_date: '',
  spending: '0',
  payment_method: 'Cash',
  entry_time: nowLocalISO(),
  exit_time: nowLocalISO(),
  accompanied: false,
  companions: '',
  memo: '',
  unpaid_amount: '0',
  received_amount: '0',
  unpaid_date: '',
  receipt: false,
});

function toFormData(r: VisitRecord): VisitRecordFormData {
  return {
    customer: r.customer,
    cast: r.cast,
    visit_date: r.visit_date,
    spending: r.spending,
    payment_method: r.payment_method,
    entry_time: r.entry_time.slice(0, 16),
    exit_time: r.exit_time.slice(0, 16),
    accompanied: r.accompanied,
    companions: r.companions,
    memo: r.memo,
    unpaid_amount: r.unpaid_amount,
    received_amount: String(r.received_amount),
    unpaid_date: r.unpaid_date,
    receipt: r.receipt,
  };
}

function formatDateTime(s: string) {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'short' });
}

function formatDate(s: string) {
  if (!s) return '—';
  return s;
}

export default function VisitRecordList() {
  const [records, setRecords] = useState<VisitRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<VisitRecordFormData | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<VisitRecordFormData | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = () => {
    axios.get<VisitRecord[]>(`${API}/visit-records/`).then((res) => setRecords(res.data)).catch(() => setRecords([]));
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get<VisitRecord[]>(`${API}/visit-records/`).then((r) => r.data).catch(() => []),
      axios.get<Customer[]>(`${API}/customers/`).then((r) => r.data).catch(() => []),
      axios.get<StaffMember[]>(`${API}/staff-members/`).then((r) => r.data).catch(() => []),
    ]).then(([recs, custs, st]) => {
      setRecords(recs);
      setCustomers(custs);
      setStaff(st);
    });
    setLoading(false);
  }, []);

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? id.slice(0, 8);
  const castLabel = (id: string) => staff.find((s) => s.id === id)?.id?.slice(0, 8) ?? id.slice(0, 8);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...createForm,
        spending: createForm.spending,
        unpaid_amount: createForm.unpaid_amount,
        received_amount: Number(createForm.received_amount),
        entry_time: createForm.entry_time ? new Date(createForm.entry_time).toISOString() : null,
        exit_time: createForm.exit_time ? new Date(createForm.exit_time).toISOString() : null,
      };
      await axios.post(`${API}/visit-records/`, payload);
      fetchRecords();
      setCreateOpen(false);
      setCreateForm(null);
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : 'Failed to create.');
    }
    setSaving(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId || !editForm) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...editForm,
        received_amount: Number(editForm.received_amount),
        entry_time: editForm.entry_time ? new Date(editForm.entry_time).toISOString() : null,
        exit_time: editForm.exit_time ? new Date(editForm.exit_time).toISOString() : null,
      };
      await axios.patch(`${API}/visit-records/${editId}/`, payload);
      fetchRecords();
      setEditId(null);
      setEditForm(null);
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : 'Failed to update.');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await axios.delete(`${API}/visit-records/${id}/`);
      fetchRecords();
      setDeleteConfirmId(null);
      if (viewId === id) setViewId(null);
    } catch {
      setError('Failed to delete.');
    }
  };

  const openEdit = (r: VisitRecord) => {
    setEditId(r.id);
    setEditForm(toFormData(r));
    setError(null);
  };

  return (
    <div className="min-h-screen bg-sky-50/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-medium text-gray-800 tracking-tight">来店記録</h1>
            <p className="mt-1 text-sm text-gray-500">来店・売上記録の登録・閲覧・編集・削除</p>
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
                  <th className="px-4 py-3 font-medium text-gray-700">お客様</th>
                  <th className="px-4 py-3 font-medium text-gray-700">来店日</th>
                  <th className="px-4 py-3 font-medium text-gray-700">利用額</th>
                  <th className="px-4 py-3 font-medium text-gray-700">支払方法</th>
                  <th className="px-4 py-3 font-medium text-gray-700">入店</th>
                  <th className="px-4 py-3 font-medium text-gray-700">退店</th>
                  <th className="px-4 py-3 font-medium text-gray-700 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">記録がありません</td></tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-sky-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{customerName(r.customer)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(r.visit_date)}</td>
                      <td className="px-4 py-3 text-gray-600">{r.spending} 円</td>
                      <td className="px-4 py-3 text-gray-600">{r.payment_method}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDateTime(r.entry_time)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDateTime(r.exit_time)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-1 sm:gap-2 items-center">
                          <button type="button" className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 text-xs sm:text-sm" onClick={() => setViewId(r.id)}><IconView />表示</button>
                          <button type="button" className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-800 text-xs sm:text-sm" onClick={() => openEdit(r)}><IconEdit />編集</button>
                          {deleteConfirmId === r.id ? (
                            <>
                              <button type="button" className="inline-flex items-center gap-1 text-red-600 text-xs sm:text-sm font-medium" onClick={() => handleDelete(r.id)}><IconCheck />削除する</button>
                              <button type="button" className="inline-flex items-center gap-1 text-gray-500 text-xs sm:text-sm" onClick={() => setDeleteConfirmId(null)}><IconClose />キャンセル</button>
                            </>
                          ) : (
                            <button type="button" className="inline-flex items-center gap-1 text-red-500 hover:text-red-600 text-xs sm:text-sm" onClick={() => setDeleteConfirmId(r.id)}><IconDelete />削除</button>
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
          const r = records.find((x) => x.id === viewId);
          if (!r) return null;
          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => setViewId(null)}>
              <div className="w-full max-w-lg rounded-2xl bg-white shadow-lg border border-gray-100 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-lg font-medium text-gray-800 border-b border-gray-100 pb-3">来店記録</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  <div><dt className="text-gray-500">お客様</dt><dd className="font-medium">{customerName(r.customer)}</dd></div>
                  <div><dt className="text-gray-500">担当</dt><dd>{castLabel(r.cast)}</dd></div>
                  <div><dt className="text-gray-500">来店日</dt><dd>{formatDate(r.visit_date)}</dd></div>
                  <div><dt className="text-gray-500">利用額</dt><dd>{r.spending} 円</dd></div>
                  <div><dt className="text-gray-500">支払方法</dt><dd>{r.payment_method}</dd></div>
                  <div><dt className="text-gray-500">入店</dt><dd>{formatDateTime(r.entry_time)}</dd></div>
                  <div><dt className="text-gray-500">退店</dt><dd>{formatDateTime(r.exit_time)}</dd></div>
                  <div><dt className="text-gray-500">同伴</dt><dd>{r.accompanied ? 'はい' : 'いいえ'}</dd></div>
                  {r.companions && <div><dt className="text-gray-500">同伴者</dt><dd>{r.companions}</dd></div>}
                  {r.memo && <div><dt className="text-gray-500">メモ</dt><dd className="whitespace-pre-wrap">{r.memo}</dd></div>}
                  <div><dt className="text-gray-500">未払額</dt><dd>{r.unpaid_amount} 円</dd></div>
                  <div><dt className="text-gray-500">受取額</dt><dd>{r.received_amount} 円</dd></div>
                  <div><dt className="text-gray-500">未払日</dt><dd>{formatDate(r.unpaid_date)}</dd></div>
                  <div><dt className="text-gray-500">領収書</dt><dd>{r.receipt ? 'あり' : 'なし'}</dd></div>
                </dl>
                <div className="mt-4 flex gap-2">
                  <button type="button" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 text-white text-sm hover:bg-sky-600" onClick={() => { setViewId(null); openEdit(r); }}><IconEdit />編集</button>
                  <button type="button" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50" onClick={() => setViewId(null)}><IconClose />閉じる</button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Create modal */}
        {createOpen && createForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => setCreateOpen(false)}>
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-lg border border-gray-100 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-medium text-gray-800 border-b border-gray-100 pb-3">来店記録を登録</h2>
              <VisitRecordForm
                form={createForm}
                setForm={setCreateForm}
                customers={customers}
                staff={staff}
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
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-lg border border-gray-100 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-medium text-gray-800 border-b border-gray-100 pb-3">来店記録を編集</h2>
              <VisitRecordForm
                form={editForm}
                setForm={setEditForm}
                customers={customers}
                staff={staff}
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

interface VisitRecordFormProps {
  form: VisitRecordFormData;
  setForm: React.Dispatch<React.SetStateAction<VisitRecordFormData | null>>;
  customers: Customer[];
  staff: StaffMember[];
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  submitLabel: string;
  onCancel: () => void;
}

function VisitRecordForm({ form, setForm, customers, staff, onSubmit, saving, submitLabel, onCancel }: VisitRecordFormProps) {
  const update = (patch: Partial<VisitRecordFormData>) => setForm((f) => (f ? { ...f, ...patch } : null));
  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
      <div>
        <label className={labelClass}>お客様 *</label>
        <select value={form.customer} onChange={(e) => update({ customer: e.target.value })} className={inputClass} required>
          <option value="">選択してください</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className={labelClass}>担当（キャスト） *</label>
        <select value={form.cast} onChange={(e) => update({ cast: e.target.value })} className={inputClass} required>
          <option value="">選択してください</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.id.slice(0, 8)}…</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>来店日 *</label>
          <input type="date" value={form.visit_date} onChange={(e) => update({ visit_date: e.target.value })} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>利用額（円） *</label>
          <input type="number" step="0.01" min="0" value={form.spending} onChange={(e) => update({ spending: e.target.value })} className={inputClass} required />
        </div>
      </div>
      <div>
        <label className={labelClass}>支払方法 *</label>
        <select value={form.payment_method} onChange={(e) => update({ payment_method: e.target.value as PaymentMethod })} className={inputClass} required>
          {PAYMENT_METHODS.map((pm) => <option key={pm} value={pm}>{pm}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>入店日時</label>
          <input type="datetime-local" value={form.entry_time} onChange={(e) => update({ entry_time: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>退店日時</label>
          <input type="datetime-local" value={form.exit_time} onChange={(e) => update({ exit_time: e.target.value })} className={inputClass} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="accompanied" checked={form.accompanied} onChange={(e) => update({ accompanied: e.target.checked })} className="rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
        <label htmlFor="accompanied" className="text-sm text-gray-700">同伴あり</label>
      </div>
      <div>
        <label className={labelClass}>同伴者</label>
        <input type="text" value={form.companions} onChange={(e) => update({ companions: e.target.value })} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>メモ</label>
        <textarea value={form.memo} onChange={(e) => update({ memo: e.target.value })} className={inputClass} rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>未払額（円）</label>
          <input type="number" step="0.01" min="0" value={form.unpaid_amount} onChange={(e) => update({ unpaid_amount: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>受取額（円）</label>
          <input type="number" min="0" value={form.received_amount} onChange={(e) => update({ received_amount: e.target.value })} className={inputClass} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>未払日</label>
          <input type="date" value={form.unpaid_date} onChange={(e) => update({ unpaid_date: e.target.value })} className={inputClass} />
        </div>
        <div className="flex items-center gap-2 pt-8">
          <input type="checkbox" id="receipt" checked={form.receipt} onChange={(e) => update({ receipt: e.target.checked })} className="rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
          <label htmlFor="receipt" className="text-sm text-gray-700">領収書</label>
        </div>
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
