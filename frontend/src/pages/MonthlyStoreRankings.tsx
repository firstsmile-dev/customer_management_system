import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API } from '../config';
import { formatPrice } from '../utils/formatPrice';
import type { MonthlyStoreRankingRow, MonthlyStoreRankingsResponse } from '../types/monthlyRankings';

function ymFromInput(v: string): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(v.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

function currentMonthValue() {
  const d = new Date();
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${mo}`;
}

const th = 'text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2 px-3';
const td = 'py-2 px-3 text-sm text-gray-800';

function sortedByRank(rows: MonthlyStoreRankingRow[], rankKey: keyof MonthlyStoreRankingRow) {
  return [...rows].sort((a, b) => {
    const ra = a[rankKey] as number;
    const rb = b[rankKey] as number;
    if (ra !== rb) return ra - rb;
    return a.store_name.localeCompare(b.store_name, 'ja');
  });
}

export default function MonthlyStoreRankings() {
  const [ym, setYm] = useState(currentMonthValue);
  const [data, setData] = useState<MonthlyStoreRankingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    const parsed = ymFromInput(ym);
    if (!parsed) {
      setError('年月を正しく選択してください。');
      return;
    }
    setLoading(true);
    setError(null);
    axios
      .get<MonthlyStoreRankingsResponse>(`${API}/monthly-store-rankings/`, {
        params: { year: parsed.year, month: parsed.month },
      })
      .then((r) => setData(r.data))
      .catch((err) => {
        setData(null);
        setError(
          err?.response?.status === 403
            ? 'このレポートはオーナー・管理者のみ利用できます。'
            : 'データの取得に失敗しました。'
        );
      })
      .finally(() => setLoading(false));
  }, [ym]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const bySales = useMemo(() => (data ? sortedByRank(data.by_store, 'rank_sales') : []), [data]);
  const byGroups = useMemo(() => (data ? sortedByRank(data.by_store, 'rank_groups') : []), [data]);
  const byNew = useMemo(() => (data ? sortedByRank(data.by_store, 'rank_new_groups') : []), [data]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">当月店舗ランキング</h1>
        <p className="mt-1 text-sm text-gray-500">
          店舗ごとの売上・組数・新規組数の順位です。新規組数は「初回来店日が対象月内」のお客様の来店（店舗目標と同じ定義）です。
        </p>
      </header>

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <label className="block">
          <span className="block text-sm font-medium text-gray-700">対象年月</span>
          <input
            type="month"
            value={ym}
            onChange={(e) => setYm(e.target.value)}
            className="mt-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-sakura-300 focus:ring-1 focus:ring-sakura-300"
          />
        </label>
        <button
          type="button"
          onClick={fetchData}
          className="rounded-lg bg-sakura-500 px-4 py-2 text-sm font-medium text-white hover:bg-sakura-600"
        >
          再読み込み
        </button>
      </div>

      {loading && <p className="text-sm text-gray-500">読み込み中…</p>}
      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      {data && !loading && !error && (
        <>
          <section className="mb-8 rounded-xl border border-gray-100 bg-white/90 p-4 shadow-soft">
            <h2 className="text-sm font-semibold text-gray-800">全体（全店合計）</h2>
            <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-gray-500">当月売上</dt>
                <dd className="text-lg font-semibold text-gray-900">{formatPrice(data.overall.sales_total)}円</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">組数（来店件数）</dt>
                <dd className="text-lg font-semibold text-gray-900">{data.overall.groups_total.toLocaleString()}組</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">新規組数</dt>
                <dd className="text-lg font-semibold text-gray-900">{data.overall.new_groups_total.toLocaleString()}組</dd>
              </div>
            </dl>
          </section>

          <div className="space-y-8">
            <RankingTable
              title={`売上ランキング（${data.year}年${data.month}月）`}
              rows={bySales}
              rankKey="rank_sales"
              valueKey="sales"
              valueLabel="売上"
              formatValue={(n) => `${formatPrice(n)}円`}
            />
            <RankingTable
              title="組数ランキング"
              rows={byGroups}
              rankKey="rank_groups"
              valueKey="groups"
              valueLabel="組数"
              formatValue={(n) => `${n.toLocaleString()}組`}
            />
            <RankingTable
              title="新規組数ランキング"
              rows={byNew}
              rankKey="rank_new_groups"
              valueKey="new_groups"
              valueLabel="新規組数"
              formatValue={(n) => `${n.toLocaleString()}組`}
            />
          </div>
        </>
      )}
    </div>
  );
}

function RankingTable({
  title,
  rows,
  rankKey,
  valueKey,
  valueLabel,
  formatValue,
}: {
  title: string;
  rows: MonthlyStoreRankingRow[];
  rankKey: keyof MonthlyStoreRankingRow;
  valueKey: keyof MonthlyStoreRankingRow;
  valueLabel: string;
  formatValue: (n: number) => string;
}) {
  return (
    <section className="rounded-xl border border-gray-100 bg-white/90 shadow-soft overflow-hidden">
      <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="overflow-x-auto p-2">
        <table className="min-w-[280px] w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className={th}>順位</th>
              <th className={th}>店舗</th>
              <th className={th}>{valueLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.store_id} className="border-b border-gray-50 last:border-0">
                <td className={td}>{r[rankKey] as number}</td>
                <td className={td}>{r.store_name}</td>
                <td className={td}>{formatValue(r[valueKey] as number)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
