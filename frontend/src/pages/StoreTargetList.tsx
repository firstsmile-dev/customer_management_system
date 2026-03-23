import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API } from '../config';
import { ERROR_MESSAGES } from '../utils/errorMessages';
import { formatPrice } from '../utils/formatPrice';
import type { Store, Customer } from '../types/customer';
import type { VisitRecord } from '../types/visitRecord';
import type { StoreTarget, StoreTargetFormData, StoreTargetType } from '../types/storeTarget';
import { STORE_TARGET_TYPES } from '../types/storeTarget';

const inputClass =
  'mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-800 shadow-sm focus:border-sky-300 focus:ring-1 focus:ring-sky-300 text-sm';
const labelClass = 'block text-sm font-medium text-gray-700';

function todayISO() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function monthISO() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
}

function startOfMonth(iso: string) {
  if (!iso) return monthISO();
  const [y, m] = iso.split('-');
  if (!y || !m) return monthISO();
  return `${y}-${m}-01`;
}

function sameMonth(a: string, b: string) {
  return a.slice(0, 7) === b.slice(0, 7);
}

type Actuals = {
  sales: number;
  groups: number;
  newSales: number;
  newGroups: number;
};

export default function StoreTargetList() {
  const [stores, setStores] = useState<Store[]>([]);
  const [targets, setTargets] = useState<StoreTarget[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [visitRecords, setVisitRecords] = useState<VisitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [storeId, setStoreId] = useState('');
  const [targetType, setTargetType] = useState<StoreTargetType>('Monthly');
  const [targetDate, setTargetDate] = useState(startOfMonth(todayISO()));

  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<StoreTargetFormData>({
    store: '',
    target_type: 'Monthly',
    target_date: startOfMonth(todayISO()),
    sales_target: '0',
    group_target: '0',
    new_sales_target: '0',
    new_group_target: '0',
  });

  const storeName = (id: string) => stores.find((s) => s.id === id)?.name ?? id.slice(0, 8);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get<Store[]>(`${API}/stores/`).then((r) => r.data).catch(() => []),
      axios.get<StoreTarget[]>(`${API}/store-targets/`).then((r) => r.data).catch(() => []),
      axios.get<Customer[]>(`${API}/customers/`).then((r) => r.data).catch(() => []),
      axios.get<VisitRecord[]>(`${API}/visit-records/`).then((r) => r.data).catch(() => []),
    ])
      .then(([s, t, c, v]) => {
        setStores(s);
        setTargets(t);
        setCustomers(c);
        setVisitRecords(v);
        if (s.length > 0) {
          setStoreId(s[0].id);
          setForm((f) => ({ ...f, store: s[0].id }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const customerToStore = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach((c) => map.set(c.id, c.store));
    return map;
  }, [customers]);

  const customerFirstVisit = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach((c) => map.set(c.id, c.first_visit));
    return map;
  }, [customers]);

  const computeActuals = useMemo(() => {
    const byKey = new Map<string, Actuals>();
    visitRecords.forEach((r) => {
      const sId = customerToStore.get(r.customer);
      if (!sId) return;
      // month key and day key
      const monthKey = `${sId}\tMonthly\t${startOfMonth(r.visit_date)}`;
      const dayKey = `${sId}\tDaily\t${r.visit_date}`;
      const amount = Number(r.spending || 0);
      const firstVisit = customerFirstVisit.get(r.customer) ?? '';
      const isNewForMonth = Boolean(firstVisit) && sameMonth(firstVisit, r.visit_date);
      const isNewForDay = Boolean(firstVisit) && firstVisit === r.visit_date;

      const add = (key: string, isNew: boolean) => {
        const cur = byKey.get(key) ?? { sales: 0, groups: 0, newSales: 0, newGroups: 0 };
        cur.sales += amount;
        cur.groups += 1;
        if (isNew) {
          cur.newSales += amount;
          cur.newGroups += 1;
        }
        byKey.set(key, cur);
      };

      add(monthKey, isNewForMonth);
      add(dayKey, isNewForDay);
    });
    return byKey;
  }, [visitRecords, customerToStore, customerFirstVisit]);

  const key = `${storeId}\t${targetType}\t${targetType === 'Monthly' ? startOfMonth(targetDate) : targetDate}`;
  const actuals = computeActuals.get(key) ?? { sales: 0, groups: 0, newSales: 0, newGroups: 0 };

  const existing = useMemo(() => {
    const normalizedDate = targetType === 'Monthly' ? startOfMonth(targetDate) : targetDate;
    return targets.find((t) => t.store === storeId && t.target_type === targetType && t.target_date === normalizedDate) ?? null;
  }, [targets, storeId, targetType, targetDate]);

  const openCreateOrEdit = () => {
    const normalizedDate = targetType === 'Monthly' ? startOfMonth(targetDate) : targetDate;
    const base: StoreTargetFormData = {
      store: storeId,
      target_type: targetType,
      target_date: normalizedDate,
      sales_target: '0',
      group_target: '0',
      new_sales_target: '0',
      new_group_target: '0',
    };
    if (existing) {
      setEditId(existing.id);
      setForm({
        store: existing.store,
        target_type: existing.target_type,
        target_date: existing.target_date,
        sales_target: String(Math.round(Number(existing.sales_target || 0))),
        group_target: String(Math.round(Number(existing.group_target || 0))),
        new_sales_target: String(Math.round(Number(existing.new_sales_target || 0))),
        new_group_target: String(Math.round(Number(existing.new_group_target || 0))),
      });
    } else {
      setEditId(null);
      setForm(base);
    }
    setError(null);
  };

  const refreshTargets = () => {
    axios.get<StoreTarget[]>(`${API}/store-targets/`).then((r) => setTargets(r.data)).catch(() => setTargets([]));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        store: form.store,
        target_type: form.target_type,
        target_date: form.target_type === 'Monthly' ? startOfMonth(form.target_date) : form.target_date,
        sales_target: String(Math.round(Number(form.sales_target || 0))),
        group_target: String(Math.round(Number(form.group_target || 0))),
        new_sales_target: String(Math.round(Number(form.new_sales_target || 0))),
        new_group_target: String(Math.round(Number(form.new_group_target || 0))),
      };
      if (editId) {
        await axios.patch(`${API}/store-targets/${editId}/`, payload);
      } else {
        await axios.post(`${API}/store-targets/`, payload);
      }
      refreshTargets();
    } catch {
      setError(editId ? ERROR_MESSAGES.update : ERROR_MESSAGES.create);
    }
    setSaving(false);
  };

  const mismatch = (target: number, actual: number) => target !== actual;

  return (
    <div className="min-h-screen bg-sky-50/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-gray-800 tracking-tight">店舗目標</h1>
          <p className="mt-1 text-sm text-gray-500">店舗ごとの目標（売上・組数・新規）を登録します。新規=お客様の初回来店日が対象期間内。</p>
        </div>

        {error && <div className="mt-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>}

        {loading ? (
          <p className="mt-8 text-gray-500">読み込み中…</p>
        ) : (
          <>
            <section className="mt-6 rounded-2xl border border-gray-100 bg-white shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/80 flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-gray-700">対象</span>
                <select value={storeId} onChange={(e) => { setStoreId(e.target.value); setForm((f) => ({ ...f, store: e.target.value })); }} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <select value={targetType} onChange={(e) => setTargetType(e.target.value as StoreTargetType)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                  {STORE_TARGET_TYPES.map((t) => (
                    <option key={t} value={t}>{t === 'Daily' ? '日次' : '月次'}</option>
                  ))}
                </select>
                <input
                  type={targetType === 'Daily' ? 'date' : 'month'}
                  value={targetType === 'Daily' ? targetDate : targetDate.slice(0, 7)}
                  onChange={(e) => setTargetDate(targetType === 'Daily' ? e.target.value : `${e.target.value}-01`)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                />
                <button type="button" onClick={openCreateOrEdit} className="ml-auto text-sm text-sky-600 hover:text-sky-700 font-medium">
                  {existing ? '目標を編集' : '+ 目標を登録'}
                </button>
              </div>

              <div className="p-5">
                <h2 className="text-sm font-medium text-gray-700">実績（キャスト入力の来店記録集計）</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-4 text-sm">
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <p className="text-gray-500">売上</p>
                    <p className="mt-1 font-semibold text-gray-900">{formatPrice(actuals.sales)} 円</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <p className="text-gray-500">組数</p>
                    <p className="mt-1 font-semibold text-gray-900">{formatPrice(actuals.groups)}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <p className="text-gray-500">新規売上</p>
                    <p className="mt-1 font-semibold text-gray-900">{formatPrice(actuals.newSales)} 円</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <p className="text-gray-500">新規組数</p>
                    <p className="mt-1 font-semibold text-gray-900">{formatPrice(actuals.newGroups)}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-gray-100 bg-white shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-sky-50/50">
                <h2 className="text-sm font-medium text-gray-700">{existing ? '目標を編集' : '目標を登録'}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  店舗「{storeName(storeId)}」 / {targetType === 'Daily' ? targetDate : targetDate.slice(0, 7)}
                </p>
              </div>
              <div className="p-5">
                <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>売上目標（円）</label>
                    <input type="number" step="1" min="0" value={form.sales_target} onChange={(e) => setForm((f) => ({ ...f, sales_target: e.target.value }))} className={inputClass} />
                    {mismatch(Number(form.sales_target || 0), actuals.sales) && (
                      <p className="mt-1 text-xs text-amber-700">実績と相違があります（実績 {formatPrice(actuals.sales)}）</p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>組数目標</label>
                    <input type="number" step="1" min="0" value={form.group_target} onChange={(e) => setForm((f) => ({ ...f, group_target: e.target.value }))} className={inputClass} />
                    {mismatch(Number(form.group_target || 0), actuals.groups) && (
                      <p className="mt-1 text-xs text-amber-700">実績と相違があります（実績 {formatPrice(actuals.groups)}）</p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>新規売上目標（円）</label>
                    <input type="number" step="1" min="0" value={form.new_sales_target} onChange={(e) => setForm((f) => ({ ...f, new_sales_target: e.target.value }))} className={inputClass} />
                    {mismatch(Number(form.new_sales_target || 0), actuals.newSales) && (
                      <p className="mt-1 text-xs text-amber-700">実績と相違があります（実績 {formatPrice(actuals.newSales)}）</p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>新規組数目標</label>
                    <input type="number" step="1" min="0" value={form.new_group_target} onChange={(e) => setForm((f) => ({ ...f, new_group_target: e.target.value }))} className={inputClass} />
                    {mismatch(Number(form.new_group_target || 0), actuals.newGroups) && (
                      <p className="mt-1 text-xs text-amber-700">実績と相違があります（実績 {formatPrice(actuals.newGroups)}）</p>
                    )}
                  </div>
                  <div className="sm:col-span-2 flex gap-2 pt-2">
                    <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 disabled:opacity-60">
                      {saving ? '送信中…' : existing ? '保存' : '登録'}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

