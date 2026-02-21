import React, { useState, useEffect } from 'react';
import axios from 'axios';
import type { DailySummary } from '../types/dailySummary';
import type { Store } from '../types/customer';

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

function todayISO() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function DailyExpenseEntry() {
  const [stores, setStores] = useState<Store[]>([]);
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [storeId, setStoreId] = useState('');
  const [reportDate, setReportDate] = useState(todayISO());
  const [totalExpenses, setTotalExpenses] = useState('');
  const [laborCosts, setLaborCosts] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchSummaries = () => {
    axios.get<DailySummary[]>(`${API}/daily-summaries/`).then((r) => setSummaries(r.data)).catch(() => setSummaries([]));
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get<Store[]>(`${API}/stores/`).then((r) => r.data).catch(() => []),
      axios.get<DailySummary[]>(`${API}/daily-summaries/`).then((r) => r.data).catch(() => []),
    ]).then(([s, sum]) => {
      setStores(s);
      setSummaries(sum);
      if (s.length > 0 && !storeId) setStoreId(s[0].id);
    });
    setLoading(false);
  }, []);

  const storeName = (id: string) => stores.find((s) => s.id === id)?.name ?? id.slice(0, 8);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !reportDate.trim()) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    const expenses = totalExpenses.trim() === '' ? '0' : totalExpenses;
    const labor = laborCosts.trim() === '' ? '0' : laborCosts;
    try {
      const existing = summaries.find((s) => s.store === storeId && s.report_date === reportDate);
      if (existing) {
        await axios.patch(`${API}/daily-summaries/${existing.id}/`, {
          store: existing.store,
          report_date: existing.report_date,
          total_sales: existing.total_sales,
          total_expenses: expenses,
          labor_costs: labor,
          notes: notes.trim(),
        });
      } else {
        await axios.post(`${API}/daily-summaries/`, {
          store: storeId,
          report_date: reportDate,
          total_sales: '0',
          total_expenses: expenses,
          labor_costs: labor,
          notes: notes.trim(),
        });
      }
      fetchSummaries();
      setSuccess(true);
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : '送信に失敗しました。');
    }
    setSaving(false);
  };

  const recentSummaries = [...summaries].sort((a, b) => b.report_date.localeCompare(a.report_date)).slice(0, 20);

  return (
    <div className="min-h-screen bg-sky-50/80">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-xl sm:text-2xl font-medium text-gray-800 tracking-tight">日次経費入力</h1>
        <p className="mt-1 text-sm text-gray-500">日別の経費・人件費を入力・送信します。</p>

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
          <>
            <form onSubmit={handleSubmit} className="mt-6 rounded-xl border border-gray-100 bg-white/90 shadow-sm p-6 space-y-4">
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
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 disabled:opacity-60">
                <IconSave />{saving ? '送信中…' : '送信'}
              </button>
            </form>

            <section className="mt-8">
              <h2 className="text-sm font-medium text-gray-700 mb-3">直近の日次サマリー（経費・人件費）</h2>
              <div className="rounded-xl border border-gray-100 bg-white/90 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/80">
                      <th className="px-4 py-3 font-medium text-gray-700">店舗</th>
                      <th className="px-4 py-3 font-medium text-gray-700">対象日</th>
                      <th className="px-4 py-3 font-medium text-gray-700">経費（円）</th>
                      <th className="px-4 py-3 font-medium text-gray-700">人件費（円）</th>
                      <th className="px-4 py-3 font-medium text-gray-700">備考</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSummaries.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">データがありません</td></tr>
                    ) : (
                      recentSummaries.map((s) => (
                        <tr key={s.id} className="border-b border-gray-50 hover:bg-sky-50/30">
                          <td className="px-4 py-3 text-gray-900">{storeName(s.store)}</td>
                          <td className="px-4 py-3 text-gray-600">{s.report_date}</td>
                          <td className="px-4 py-3 text-gray-600">{s.total_expenses}</td>
                          <td className="px-4 py-3 text-gray-600">{s.labor_costs}</td>
                          <td className="px-4 py-3 text-gray-500 max-w-[120px] truncate" title={s.notes || undefined}>{s.notes || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
