import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import type { DailySummary } from '../types/dailySummary';
import { ERROR_MESSAGES } from '../utils/errorMessages';
import type { Store, Customer } from '../types/customer';
import type { VisitRecord } from '../types/visitRecord';

const API = '/api';

const inputClass =
  'mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-800 shadow-sm focus:border-sky-300 focus:ring-1 focus:ring-sky-300 text-sm';
const labelClass = 'block text-sm font-medium text-gray-700';

const iconClass = 'w-4 h-4 shrink-0';
const IconSave = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);
const IconClose = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
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

function todayISO() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Sum of visit_records.spending for the given store and date (customers belonging to that store, visit_date = date). */
function computeTotalSalesFromVisits(
  visitRecords: VisitRecord[],
  customers: Customer[],
  storeId: string,
  reportDate: string
): number {
  const customerIdsForStore = new Set(customers.filter((c) => c.store === storeId).map((c) => c.id));
  return visitRecords
    .filter((r) => r.visit_date === reportDate && customerIdsForStore.has(r.customer))
    .reduce((sum, r) => sum + Number(r.spending || 0), 0);
}

export default function DailyExpenseEntry() {
  const [stores, setStores] = useState<Store[]>([]);
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [visitRecords, setVisitRecords] = useState<VisitRecord[]>([]);
  const [storeId, setStoreId] = useState('');
  const [reportDate, setReportDate] = useState(todayISO());
  const [totalExpenses, setTotalExpenses] = useState('');
  const [laborCosts, setLaborCosts] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchSummaries = () => {
    axios.get<DailySummary[]>(`${API}/daily-summaries/`).then((r) => setSummaries(r.data)).catch(() => setSummaries([]));
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get<Store[]>(`${API}/stores/`).then((r) => r.data).catch(() => []),
      axios.get<DailySummary[]>(`${API}/daily-summaries/`).then((r) => r.data).catch(() => []),
      axios.get<Customer[]>(`${API}/customers/`).then((r) => r.data).catch(() => []),
      axios.get<VisitRecord[]>(`${API}/visit-records/`).then((r) => r.data).catch(() => []),
    ]).then(([s, sum, custs, recs]) => {
      setStores(s);
      setSummaries(sum);
      setCustomers(custs);
      setVisitRecords(recs);
      if (s.length > 0 && !storeId) setStoreId(s[0].id);
    });
    setLoading(false);
  }, []);

  const storeName = (id: string) => stores.find((s) => s.id === id)?.name ?? id.slice(0, 8);

  /** Computed total_sales for the current modal store + date (from visit_records). */
  const computedTotalSales = useMemo(
    () => (storeId && reportDate ? computeTotalSalesFromVisits(visitRecords, customers, storeId, reportDate) : 0),
    [visitRecords, customers, storeId, reportDate]
  );

  const openModal = () => {
    setError(null);
    setEditId(null);
    setReportDate(todayISO());
    setTotalExpenses('');
    setLaborCosts('');
    setNotes('');
    setModalOpen(true);
  };

  const openEdit = (s: DailySummary) => {
    setError(null);
    setEditId(s.id);
    setStoreId(s.store);
    setReportDate(s.report_date);
    setTotalExpenses(s.total_expenses ?? '');
    setLaborCosts(s.labor_costs ?? '');
    setNotes(s.notes ?? '');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !reportDate.trim()) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    const expenses = totalExpenses.trim() === '' ? '0' : totalExpenses;
    const labor = laborCosts.trim() === '' ? '0' : laborCosts;
    const totalSales = String(computedTotalSales);
    try {
      if (editId) {
        await axios.patch(`${API}/daily-summaries/${editId}/`, {
          store: storeId,
          report_date: reportDate,
          total_sales: totalSales,
          total_expenses: expenses,
          labor_costs: labor,
          notes: notes.trim(),
        });
      } else {
        const existing = summaries.find((s) => s.store === storeId && s.report_date === reportDate);
        if (existing) {
          await axios.patch(`${API}/daily-summaries/${existing.id}/`, {
            store: existing.store,
            report_date: existing.report_date,
            total_sales: totalSales,
            total_expenses: expenses,
            labor_costs: labor,
            notes: notes.trim(),
          });
        } else {
          await axios.post(`${API}/daily-summaries/`, {
            store: storeId,
            report_date: reportDate,
            total_sales: totalSales,
            total_expenses: expenses,
            labor_costs: labor,
            notes: notes.trim(),
          });
        }
      }
      fetchSummaries();
      setSuccess(true);
      closeModal();
    } catch (err: unknown) {
      setError(ERROR_MESSAGES.create);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await axios.delete(`${API}/daily-summaries/${id}/`);
      fetchSummaries();
      setDeleteConfirmId(null);
    } catch {
      setError(ERROR_MESSAGES.delete);
    }
  };

  const recentSummaries = [...summaries].sort((a, b) => b.report_date.localeCompare(a.report_date)).slice(0, 20);

  return (
    <div className="min-h-screen bg-sky-50/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-medium text-gray-800 tracking-tight">日次経費入力</h1>
            <p className="mt-1 text-sm text-gray-500">日別の経費・人件費を入力・送信します。</p>
          </div>
          <button
            type="button"
            onClick={openModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-medium hover:bg-sky-600"
          >
            <IconAdd /> 経費を登録
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 rounded-lg bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700">
            送信しました。
          </div>
        )}

        {loading ? (
          <p className="mt-8 text-gray-500">読み込み中…</p>
        ) : (
          <section className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h2 className="text-sm font-medium text-gray-700">直近の日次サマリー（経費・人件費）</h2>
              <button type="button" onClick={openModal} className="text-sm text-sky-600 hover:text-sky-700 font-medium">+ 経費を登録</button>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white/90 shadow-sm overflow-x-auto">
              <table className="w-full min-w-max text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    <th className="px-2 sm:px-4 py-3 font-medium text-gray-700 whitespace-nowrap">店舗</th>
                    <th className="px-2 sm:px-4 py-3 font-medium text-gray-700 whitespace-nowrap">対象日</th>
                    <th className="px-2 sm:px-4 py-3 font-medium text-gray-700 whitespace-nowrap">売上（円）</th>
                    <th className="px-2 sm:px-4 py-3 font-medium text-gray-700 whitespace-nowrap">経費（円）</th>
                    <th className="px-2 sm:px-4 py-3 font-medium text-gray-700 whitespace-nowrap">人件費（円）</th>
                    <th className="px-2 sm:px-4 py-3 font-medium text-gray-700 whitespace-nowrap">備考</th>
                    <th className="px-2 sm:px-4 py-3 font-medium text-gray-700 text-right whitespace-nowrap">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSummaries.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">データがありません</td></tr>
                  ) : (
                    recentSummaries.map((s) => (
                      <tr key={s.id} className="border-b border-gray-50 hover:bg-sky-50/30">
                        <td className="px-2 sm:px-4 py-3 text-gray-900 whitespace-nowrap">{storeName(s.store)}</td>
                        <td className="px-2 sm:px-4 py-3 text-gray-600 whitespace-nowrap">{s.report_date}</td>
                        <td className="px-2 sm:px-4 py-3 text-gray-600 whitespace-nowrap">{s.total_sales}</td>
                        <td className="px-2 sm:px-4 py-3 text-gray-600 whitespace-nowrap">{s.total_expenses}</td>
                        <td className="px-2 sm:px-4 py-3 text-gray-600 whitespace-nowrap">{s.labor_costs}</td>
                        <td className="px-2 sm:px-4 py-3 text-gray-500 max-w-[240px] truncate" title={s.notes || undefined}>{s.notes || '—'}</td>
                        <td className="px-2 sm:px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex flex-wrap justify-end gap-1 sm:gap-2 items-center">
                            <button type="button" className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 text-xs sm:text-sm" onClick={() => openEdit(s)}><IconEdit />編集</button>
                            {deleteConfirmId === s.id ? (
                              <>
                                <button type="button" className="inline-flex items-center gap-1 text-red-600 text-xs sm:text-sm font-medium" onClick={() => handleDelete(s.id)}><IconCheck />削除する</button>
                                <button type="button" className="inline-flex items-center gap-1 text-gray-500 text-xs sm:text-sm" onClick={() => setDeleteConfirmId(null)}><IconClose />キャンセル</button>
                              </>
                            ) : (
                              <button type="button" className="inline-flex items-center gap-1 text-red-500 hover:text-red-600 text-xs sm:text-sm" onClick={() => setDeleteConfirmId(s.id)}><IconDelete />削除</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Create / Edit modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={closeModal}>
            <div className="w-full max-w-md rounded-2xl bg-white shadow-lg border border-gray-100 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-medium text-gray-800 border-b border-gray-100 pb-3">{editId ? '経費を編集' : '経費を登録'}</h2>
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className={labelClass}>店舗 *</label>
                  <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className={inputClass} required>
                    <option value="">選択してください</option>
                    {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>対象日 *</label>
                  <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>売上合計（円）</label>
                  <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
                    {computedTotalSales.toLocaleString()}（来店記録の利用額の合計）
                  </div>
                </div>
                <div>
                  <label className={labelClass}>経費合計（円） *</label>
                  <input type="number" step="0.01" min="0" value={totalExpenses} onChange={(e) => setTotalExpenses(e.target.value)} className={inputClass} placeholder="0" required />
                </div>
                <div>
                  <label className={labelClass}>人件費（円） *</label>
                  <input type="number" step="0.01" min="0" value={laborCosts} onChange={(e) => setLaborCosts(e.target.value)} className={inputClass} placeholder="0" required />
                </div>
                <div>
                  <label className={labelClass}>備考</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={3} placeholder="メモ（任意）" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 disabled:opacity-60">
                    <IconSave />{saving ? '送信中…' : '送信'}
                  </button>
                  <button type="button" onClick={closeModal} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50">
                    <IconClose />キャンセル
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
