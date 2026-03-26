import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API } from '../config';
import { formatPrice } from '../utils/formatPrice';
import type { PersonalLedgerEntry, PersonalLedgerFormData, PersonalLedgerSummary } from '../types/personalLedger';

const inputClass =
  'mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-800 shadow-sm focus:border-sakura-300 focus:ring-1 focus:ring-sakura-300 text-sm';
const labelClass = 'block text-sm font-medium text-gray-700';

function todayISO() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function monthValue() {
  return todayISO().slice(0, 7);
}

function parseYM(v: string): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(v.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  return { year, month };
}

const emptyForm: PersonalLedgerFormData = {
  entry_date: todayISO(),
  entry_type: 'Expense',
  amount: '',
  category: '',
  memo: '',
};

export default function PersonalLedger() {
  const [entries, setEntries] = useState<PersonalLedgerEntry[]>([]);
  const [summary, setSummary] = useState<PersonalLedgerSummary | null>(null);
  const [month, setMonth] = useState(monthValue);
  const [form, setForm] = useState<PersonalLedgerFormData>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ym = useMemo(() => parseYM(month), [month]);

  const refresh = () => {
    if (!ym) return;
    setLoading(true);
    setError(null);
    Promise.all([
      axios
        .get<PersonalLedgerEntry[]>(`${API}/personal-ledger/`, { params: { entry_date__year: ym.year, entry_date__month: ym.month } })
        .then((r) => r.data)
        .catch(() => []),
      axios
        .get<PersonalLedgerSummary>(`${API}/personal-ledger/summary/`, { params: { year: ym.year, month: ym.month } })
        .then((r) => r.data)
        .catch(() => null),
    ])
      .then(([e, s]) => {
        setEntries(e);
        setSummary(s);
      })
      .catch(() => setError('データの取得に失敗しました。'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Math.round(Number(form.amount || 0));
    if (!form.entry_date || !Number.isFinite(amountNum) || amountNum <= 0) {
      setError('日付と金額（1以上）を入力してください。');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await axios.post(`${API}/personal-ledger/`, {
        entry_date: form.entry_date,
        entry_type: form.entry_type,
        amount: String(amountNum),
        category: form.category,
        memo: form.memo,
      });
      setForm((f) => ({ ...f, amount: '', category: '', memo: '' }));
      refresh();
    } catch {
      setError('登録に失敗しました。');
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!window.confirm('この収支を削除しますか？')) return;
    try {
      await axios.delete(`${API}/personal-ledger/${id}/`);
      refresh();
    } catch {
      setError('削除に失敗しました。');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">家計簿（個人収支）</h1>
        <p className="mt-1 text-sm text-gray-500">キャスト本人の収入・支出を記録し、月次の合計を確認できます。</p>
      </header>

      {error && <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-gray-100 bg-white/90 shadow-soft p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold text-gray-900">収支を追加</h2>
          <form className="mt-4 space-y-3" onSubmit={submit}>
            <label className={labelClass}>
              日付
              <input type="date" value={form.entry_date} onChange={(e) => setForm((f) => ({ ...f, entry_date: e.target.value }))} className={inputClass} required />
            </label>
            <label className={labelClass}>
              区分
              <select value={form.entry_type} onChange={(e) => setForm((f) => ({ ...f, entry_type: e.target.value as 'Income' | 'Expense' }))} className={inputClass}>
                <option value="Income">収入</option>
                <option value="Expense">支出</option>
              </select>
            </label>
            <label className={labelClass}>
              金額
              <input type="number" min={1} step={1} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className={inputClass} required />
            </label>
            <label className={labelClass}>
              カテゴリ
              <input type="text" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className={inputClass} placeholder="例: 交通費 / 食費 / 給与" />
            </label>
            <label className={labelClass}>
              メモ
              <textarea value={form.memo} onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))} className={inputClass} rows={3} />
            </label>
            <button type="submit" disabled={saving} className="w-full rounded-lg bg-sakura-500 px-4 py-2 text-sm font-medium text-white hover:bg-sakura-600 disabled:opacity-60">
              {saving ? '保存中…' : '追加'}
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-gray-100 bg-white/90 shadow-soft p-5 lg:col-span-2">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-900">月次集計</h2>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700">対象年月</span>
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={inputClass} />
            </label>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-gray-500">読み込み中…</p>
          ) : (
            <>
              <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-gray-100 p-3">
                  <dt className="text-xs text-gray-500">収入</dt>
                  <dd className="text-sm font-semibold text-emerald-700">{formatPrice(summary?.income_total ?? 0)}円</dd>
                </div>
                <div className="rounded-lg border border-gray-100 p-3">
                  <dt className="text-xs text-gray-500">支出</dt>
                  <dd className="text-sm font-semibold text-red-700">{formatPrice(summary?.expense_total ?? 0)}円</dd>
                </div>
                <div className="rounded-lg border border-gray-100 p-3">
                  <dt className="text-xs text-gray-500">差額</dt>
                  <dd className="text-sm font-semibold text-gray-900">{formatPrice(summary?.balance ?? 0)}円</dd>
                </div>
                <div className="rounded-lg border border-gray-100 p-3">
                  <dt className="text-xs text-gray-500">件数</dt>
                  <dd className="text-sm font-semibold text-gray-900">{(summary?.entry_count ?? 0).toLocaleString()}件</dd>
                </div>
              </dl>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-[560px] w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="py-2 px-2">日付</th>
                      <th className="py-2 px-2">区分</th>
                      <th className="py-2 px-2">カテゴリ</th>
                      <th className="py-2 px-2">金額</th>
                      <th className="py-2 px-2">メモ</th>
                      <th className="py-2 px-2">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-gray-400">この月の記録はありません。</td>
                      </tr>
                    ) : (
                      entries.map((e) => (
                        <tr key={e.id} className="border-b border-gray-50 last:border-0">
                          <td className="py-2 px-2 text-gray-700">{e.entry_date}</td>
                          <td className={`py-2 px-2 ${e.entry_type === 'Income' ? 'text-emerald-700' : 'text-red-700'}`}>{e.entry_type === 'Income' ? '収入' : '支出'}</td>
                          <td className="py-2 px-2 text-gray-700">{e.category || '—'}</td>
                          <td className="py-2 px-2 text-gray-900">{formatPrice(Number(e.amount || 0))}円</td>
                          <td className="py-2 px-2 text-gray-600">{e.memo || '—'}</td>
                          <td className="py-2 px-2">
                            <button type="button" onClick={() => remove(e.id)} className="rounded border border-gray-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50">
                              削除
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

