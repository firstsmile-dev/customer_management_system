import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import type { Store, Customer } from '../types/customer';
import type { VisitRecord } from '../types/visitRecord';

const API = '/api';

const labelClass = 'block text-sm font-medium text-gray-700';

/** Aggregate visit_records by store and date: total_sales = sum(spending) for customers in that store. */
function aggregateSalesByStoreAndDate(
  visitRecords: VisitRecord[],
  customers: Customer[]
): { store: string; report_date: string; total_sales: number }[] {
  const customerToStore = new Map<string, string>();
  customers.forEach((c) => customerToStore.set(c.id, c.store));
  const map = new Map<string, number>();
  visitRecords.forEach((r) => {
    const storeId = customerToStore.get(r.customer);
    if (storeId == null) return;
    const key = `${storeId}\t${r.visit_date}`;
    map.set(key, (map.get(key) ?? 0) + Number(r.spending || 0));
  });
  return Array.from(map.entries()).map(([key, total_sales]) => {
    const [store, report_date] = key.split('\t');
    return { store, report_date, total_sales };
  });
}

export default function DailySalesEntry() {
  const [stores, setStores] = useState<Store[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [visitRecords, setVisitRecords] = useState<VisitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStore, setFilterStore] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get<Store[]>(`${API}/stores/`).then((r) => r.data).catch(() => []),
      axios.get<Customer[]>(`${API}/customers/`).then((r) => r.data).catch(() => []),
      axios.get<VisitRecord[]>(`${API}/visit-records/`).then((r) => r.data).catch(() => []),
    ]).then(([s, custs, recs]) => {
      setStores(s);
      setCustomers(custs);
      setVisitRecords(recs);
    });
    setLoading(false);
  }, []);

  const storeName = (id: string) => stores.find((s) => s.id === id)?.name ?? id.slice(0, 8);

  const aggregated = useMemo(
    () => aggregateSalesByStoreAndDate(visitRecords, customers),
    [visitRecords, customers]
  );

  const filtered = useMemo(() => {
    let list = [...aggregated];
    if (filterStore) list = list.filter((r) => r.store === filterStore);
    if (filterDateFrom) list = list.filter((r) => r.report_date >= filterDateFrom);
    if (filterDateTo) list = list.filter((r) => r.report_date <= filterDateTo);
    return list.sort((a, b) => b.report_date.localeCompare(a.report_date) || a.store.localeCompare(b.store));
  }, [aggregated, filterStore, filterDateFrom, filterDateTo]);

  const hasActiveFilters = Boolean(filterStore || filterDateFrom || filterDateTo);

  const clearFilters = () => {
    setFilterStore('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  return (
    <div className="min-h-screen bg-sky-50/80">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-gray-800 tracking-tight">日次売上</h1>
          <p className="mt-1 text-sm text-gray-500">来店記録の利用額を店舗・日付別に集計して表示します。</p>
        </div>

        {loading ? (
          <p className="mt-8 text-gray-500">読み込み中…</p>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-white/90 px-4 py-3 shadow-sm">
              <span className="text-sm font-medium text-gray-700">絞り込み</span>
              <div>
                <label className="sr-only">店舗</label>
                <select
                  value={filterStore}
                  onChange={(e) => setFilterStore(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-sky-300 focus:ring-1 focus:ring-sky-300"
                >
                  <option value="">すべての店舗</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass + ' sr-only'}>対象日（から）</label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-sky-300 focus:ring-1 focus:ring-sky-300"
                  title="対象日（から）"
                />
              </div>
              <span className="text-sm text-gray-400">～</span>
              <div>
                <label className={labelClass + ' sr-only'}>対象日（まで）</label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-sky-300 focus:ring-1 focus:ring-sky-300"
                  title="対象日（まで）"
                />
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm text-sky-600 hover:text-sky-700 font-medium"
                >
                  クリア
                </button>
              )}
              <span className="text-sm text-gray-500 ml-auto">
                {filtered.length}件
                {(filterStore || filterDateFrom || filterDateTo) && aggregated.length !== filtered.length && ` / 全${aggregated.length}件`}
              </span>
            </div>

            <section className="mt-4">
              <h2 className="text-sm font-medium text-gray-700 mb-3">売上一覧（来店記録の利用額合計）</h2>
              <div className="rounded-xl border border-gray-100 bg-white/90 shadow-sm overflow-x-auto">
                <table className="w-full min-w-max text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/80">
                      <th className="px-2 sm:px-4 py-3 font-medium text-gray-700 whitespace-nowrap">店舗</th>
                      <th className="px-2 sm:px-4 py-3 font-medium text-gray-700 whitespace-nowrap">対象日</th>
                      <th className="px-2 sm:px-4 py-3 font-medium text-gray-700 whitespace-nowrap">売上（円）</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                          {hasActiveFilters ? '条件に一致するデータがありません' : '来店記録がありません'}
                        </td>
                      </tr>
                    ) : (
                      filtered.map((row, i) => (
                        <tr key={`${row.store}-${row.report_date}-${i}`} className="border-b border-gray-50 hover:bg-sky-50/30">
                          <td className="px-2 sm:px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{storeName(row.store)}</td>
                          <td className="px-2 sm:px-4 py-3 text-gray-600 whitespace-nowrap">{row.report_date}</td>
                          <td className="px-2 sm:px-4 py-3 text-gray-600 whitespace-nowrap">{row.total_sales.toLocaleString()}</td>
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
