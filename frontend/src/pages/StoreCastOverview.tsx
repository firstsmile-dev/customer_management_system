import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../config';
import { formatPrice } from '../utils/formatPrice';
import type { CastOverviewRow, StoreCastOverviewResponse } from '../types/storeCastOverview';

const thClass = 'text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2 px-3';
const tdClass = 'py-2 px-3 text-sm text-gray-800 align-top';

function targetTypeLabel(t: string) {
  return t === 'Daily' ? '日次' : t === 'Monthly' ? '月次' : t;
}

export default function StoreCastOverview() {
  const [casts, setCasts] = useState<CastOverviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axios
      .get<StoreCastOverviewResponse>(`${API}/store-cast-overview/`)
      .then((r) => setCasts(r.data.casts ?? []))
      .catch((err) => {
        const msg =
          err?.response?.status === 403
            ? 'この一覧はスタッフ・マネージャーのみ利用できます。'
            : '一覧の取得に失敗しました。';
        setError(msg);
        setCasts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">キャスト状況一覧</h1>
        <p className="mt-1 text-sm text-gray-500">
          担当店舗のキャストについて、売上目標の達成状況と給与（時給・歩合）を一覧します。
        </p>
      </header>

      {loading && <p className="text-sm text-gray-500">読み込み中…</p>}
      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      {!loading && !error && casts.length === 0 && (
        <p className="text-sm text-gray-500">表示するキャストがありません。</p>
      )}

      {!loading && !error && casts.length > 0 && (
        <div className="space-y-6">
          {casts.map((c) => (
            <section
              key={c.staff_id}
              className="rounded-xl border border-gray-100 bg-white/90 shadow-soft overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h2 className="text-sm font-semibold text-gray-900">{c.email}</h2>
                {c.username ? <span className="text-xs text-gray-500">({c.username})</span> : null}
                <span className="text-xs text-gray-500">{c.store_name}</span>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="min-w-[320px] w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className={thClass}>時給</th>
                      <th className={thClass}>今月歩合</th>
                      <th className={thClass}>先月歩合</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={tdClass}>{formatPrice(c.hourly_wage)}円</td>
                      <td className={tdClass}>{formatPrice(c.current_month_commission)}円</td>
                      <td className={tdClass}>{formatPrice(c.last_month_commission)}円</td>
                    </tr>
                  </tbody>
                </table>

                <h3 className="mt-4 mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  目標達成（来店記録の利用額合計）
                </h3>
                {c.targets.length === 0 ? (
                  <p className="text-sm text-gray-400">登録された目標がありません。</p>
                ) : (
                  <table className="min-w-[480px] w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className={thClass}>種別</th>
                        <th className={thClass}>対象日</th>
                        <th className={thClass}>目標</th>
                        <th className={thClass}>達成額</th>
                        <th className={thClass}>達成率</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.targets.map((t) => (
                        <tr key={t.id} className="border-b border-gray-50 last:border-0">
                          <td className={tdClass}>{targetTypeLabel(t.target_type)}</td>
                          <td className={tdClass}>{t.target_date}</td>
                          <td className={tdClass}>{formatPrice(t.target_amount)}円</td>
                          <td className={tdClass}>{formatPrice(t.achieved_amount)}円</td>
                          <td className={tdClass}>
                            {t.achievement_percent == null ? '—' : `${t.achievement_percent}%`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
