import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API } from '../config';
import { formatPrice } from '../utils/formatPrice';
import type { HostSalaryPreview, HostSalarySetting, HostRoundingMode } from '../types/hostSalarySettings';

const inputClass =
  'mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-800 shadow-sm focus:border-sakura-300 focus:ring-1 focus:ring-sakura-300 text-sm';
const labelClass = 'block text-sm font-medium text-gray-700';

function monthValueNow() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function parseYM(v: string): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(v.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  return { year, month };
}

export default function HostSalarySettings() {
  const [setting, setSetting] = useState<HostSalarySetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [taxRate, setTaxRate] = useState('0.1000');
  const [serviceRate, setServiceRate] = useState('0.2000');
  const [roundingMode, setRoundingMode] = useState<HostRoundingMode>('Round');
  const [ym, setYm] = useState(monthValueNow);

  const [preview, setPreview] = useState<HostSalaryPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchSetting = useCallback(() => {
    setLoading(true);
    setError(null);
    axios
      .get<HostSalarySetting>(`${API}/host-salary-settings/`)
      .then((r) => {
        setSetting(r.data);
        setTaxRate(r.data.tax_rate ?? '0.1000');
        setServiceRate(r.data.service_rate ?? '0.2000');
        setRoundingMode(r.data.rounding_mode ?? 'Round');
      })
      .catch((err) => {
        setSetting(null);
        setError(
          err?.response?.status === 403
            ? 'この画面はマネージャー（ホストクラブ店舗）のみ利用できます。'
            : '設定の取得に失敗しました。'
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchPreview = useCallback(() => {
    const parsed = parseYM(ym);
    if (!parsed) {
      setError('対象年月が不正です。');
      return;
    }
    setPreviewLoading(true);
    axios
      .get<HostSalaryPreview>(`${API}/host-salary-settings/preview/`, { params: parsed })
      .then((r) => setPreview(r.data))
      .catch(() => setPreview(null))
      .finally(() => setPreviewLoading(false));
  }, [ym]);

  useEffect(() => {
    fetchSetting();
  }, [fetchSetting]);

  useEffect(() => {
    if (setting) fetchPreview();
  }, [setting, fetchPreview]);

  const multiplier = useMemo(() => {
    const t = Number(taxRate);
    const s = Number(serviceRate);
    const m = 1 + (Number.isFinite(t) ? t : 0) + (Number.isFinite(s) ? s : 0);
    return m;
  }, [taxRate, serviceRate]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        tax_rate: taxRate,
        service_rate: serviceRate,
        rounding_mode: roundingMode,
      };
      const res = await axios.patch<HostSalarySetting>(`${API}/host-salary-settings/`, payload);
      setSetting(res.data);
      setSuccess('保存しました。');
      fetchPreview();
    } catch (err: any) {
      setSuccess(null);
      setError(err?.response?.status === 403 ? '権限がありません。' : '保存に失敗しました。');
    }
    setSaving(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">給与設定（ホストクラブ）</h1>
        <p className="mt-1 text-sm text-gray-500">小計・総売上の計算に使う税率/サービス料率などを設定します。</p>
      </header>

      {loading && <p className="text-sm text-gray-500">読み込み中…</p>}
      {error && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800">
          {success}
        </div>
      )}

      {!loading && setting && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-gray-100 bg-white/90 shadow-soft p-5">
            <h2 className="text-sm font-semibold text-gray-900">計算設定</h2>
            <form className="mt-4 space-y-4" onSubmit={save}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className={labelClass}>
                  税率（例: 0.10）
                  <input value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className={inputClass} inputMode="decimal" />
                </label>
                <label className={labelClass}>
                  サービス料率（例: 0.20）
                  <input value={serviceRate} onChange={(e) => setServiceRate(e.target.value)} className={inputClass} inputMode="decimal" />
                </label>
              </div>

              <label className={labelClass}>
                端数処理（円）
                <select value={roundingMode} onChange={(e) => setRoundingMode(e.target.value as HostRoundingMode)} className={inputClass}>
                  <option value="Round">四捨五入</option>
                  <option value="Floor">切り捨て</option>
                  <option value="Ceil">切り上げ</option>
                </select>
              </label>

              <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3 text-sm text-gray-700">
                計算係数（1 + 税率 + サービス料率）: <span className="font-medium">{Number.isFinite(multiplier) ? multiplier.toFixed(4) : '—'}</span>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-sakura-500 px-4 py-2 text-sm font-medium text-white hover:bg-sakura-600 disabled:opacity-60"
              >
                {saving ? '保存中…' : '保存'}
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-gray-100 bg-white/90 shadow-soft p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">当月プレビュー</h2>
                <p className="mt-1 text-xs text-gray-500">来店記録の利用額合計から、小計/総売上の見込みを計算します。</p>
              </div>
              <label className="block">
                <span className="block text-sm font-medium text-gray-700">対象年月</span>
                <input
                  type="month"
                  value={ym}
                  onChange={(e) => setYm(e.target.value)}
                  className="mt-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-sakura-300 focus:ring-1 focus:ring-sakura-300"
                />
              </label>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={fetchPreview}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                {previewLoading ? '計算中…' : '再計算'}
              </button>
            </div>

            {!previewLoading && preview && (
              <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-gray-500">店舗</dt>
                  <dd className="text-sm font-medium text-gray-900">{preview.store_name}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">組数（来店件数）</dt>
                  <dd className="text-sm font-medium text-gray-900">{preview.groups.toLocaleString()}組</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">総売上（来店利用額合計）</dt>
                  <dd className="text-sm font-semibold text-gray-900">{formatPrice(preview.total_sales)}円</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">小計（推定）</dt>
                  <dd className="text-sm font-semibold text-gray-900">{formatPrice(preview.subtotal_estimated)}円</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-gray-500">小計→総売上（推定）</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {formatPrice(preview.total_from_subtotal_estimated)}円
                  </dd>
                </div>
              </dl>
            )}

            {!previewLoading && !preview && (
              <p className="mt-4 text-sm text-gray-400">プレビューを表示できませんでした（来店記録が無い場合は0になります）。</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

