import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { API } from '../config';
import { ERROR_MESSAGES } from '../utils/errorMessages';
import type { Store } from '../types/customer';
import type { DailyReport } from '../types/dailyReport';

const inputClass =
  'mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-800 shadow-sm focus:border-sky-300 focus:ring-1 focus:ring-sky-300 text-sm';
const labelClass = 'block text-sm font-medium text-gray-700';

function todayISO() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function canWriteDailyReport(role: string | undefined) {
  return role === 'Staff' || role === 'Manager' || role === 'Admin' || role === 'Owner';
}

export default function DailyReportList() {
  const { user } = useAuth();
  const canWrite = canWriteDailyReport(user?.role);

  const [stores, setStores] = useState<Store[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStore, setFilterStore] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [storeId, setStoreId] = useState('');
  const [reportDate, setReportDate] = useState(todayISO());
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchReports = () => {
    axios.get<DailyReport[]>(`${API}/daily-reports/`).then((r) => setReports(r.data)).catch(() => setReports([]));
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get<Store[]>(`${API}/stores/`).then((r) => r.data).catch(() => []),
      axios.get<DailyReport[]>(`${API}/daily-reports/`).then((r) => r.data).catch(() => []),
    ])
      .then(([s, r]) => {
        setStores(s);
        setReports(r);
        if (s.length > 0) {
          setStoreId(s[0].id);
          setFilterStore('');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const storeName = (id: string) => stores.find((x) => x.id === id)?.name ?? id.slice(0, 8);

  const filtered = useMemo(() => {
    let list = [...reports];
    if (filterStore) list = list.filter((x) => x.store === filterStore);
    if (filterFrom) list = list.filter((x) => x.report_date >= filterFrom);
    if (filterTo) list = list.filter((x) => x.report_date <= filterTo);
    return list.sort((a, b) => b.report_date.localeCompare(a.report_date) || a.store.localeCompare(b.store));
  }, [reports, filterStore, filterFrom, filterTo]);

  const openCreate = () => {
    setEditId(null);
    setReportDate(todayISO());
    setContent('');
    if (stores[0]) setStoreId(stores[0].id);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (r: DailyReport) => {
    setEditId(r.id);
    setStoreId(r.store);
    setReportDate(r.report_date);
    setContent(r.content ?? '');
    setError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !reportDate) return;
    setSaving(true);
    setError(null);
    try {
      const payload = { store: storeId, report_date: reportDate, content: content.trim() };
      if (editId) {
        await axios.patch(`${API}/daily-reports/${editId}/`, payload);
      } else {
        await axios.post(`${API}/daily-reports/`, payload);
      }
      fetchReports();
      closeModal();
    } catch {
      setError(editId ? ERROR_MESSAGES.update : ERROR_MESSAGES.create);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API}/daily-reports/${id}/`);
      fetchReports();
      setDeleteId(null);
    } catch {
      setError(ERROR_MESSAGES.delete);
    }
  };

  function formatDate(iso: string) {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  return (
    <div className="min-h-screen bg-sky-50/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-medium text-gray-800 tracking-tight">日報</h1>
            <p className="mt-1 text-sm text-gray-500">
              店舗ごと・1日1件の日報です。作成・編集はスタッフ・マネージャー（管理者・オーナーを含む）のみです。統括は閲覧のみです。
            </p>
          </div>
          {canWrite && (
            <button type="button" onClick={openCreate} className="px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-medium hover:bg-sky-600">
              + 日報を作成
            </button>
          )}
        </div>

        {error && <div className="mt-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>}

        {loading ? (
          <p className="mt-8 text-gray-500">読み込み中…</p>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-white/90 px-4 py-3 shadow-sm">
              <span className="text-sm font-medium text-gray-700">絞り込み</span>
              <select value={filterStore} onChange={(e) => setFilterStore(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                <option value="">すべての店舗</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" title="から" />
              <span className="text-gray-400">～</span>
              <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" title="まで" />
            </div>

            <div className="mt-4 rounded-xl border border-gray-100 bg-white/90 shadow-sm overflow-x-auto">
              <table className="w-full min-w-max text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    <th className="px-2 sm:px-4 py-3 font-medium text-gray-700 whitespace-nowrap">店舗</th>
                    <th className="px-2 sm:px-4 py-3 font-medium text-gray-700 whitespace-nowrap">日付</th>
                    <th className="px-2 sm:px-4 py-3 font-medium text-gray-700 whitespace-nowrap">内容</th>
                    <th className="px-2 sm:px-4 py-3 font-medium text-gray-700 whitespace-nowrap">更新</th>
                    {canWrite && <th className="px-2 sm:px-4 py-3 font-medium text-gray-700 text-right whitespace-nowrap">操作</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={canWrite ? 5 : 4} className="px-4 py-8 text-center text-gray-500">
                        日報がありません
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => (
                      <tr key={r.id} className="border-b border-gray-50 hover:bg-sky-50/30">
                        <td className="px-2 sm:px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{storeName(r.store)}</td>
                        <td className="px-2 sm:px-4 py-3 text-gray-600 whitespace-nowrap">{r.report_date}</td>
                        <td className="px-2 sm:px-4 py-3 text-gray-600 max-w-md truncate" title={r.content || undefined}>{r.content?.trim() ? r.content.slice(0, 120) + (r.content.length > 120 ? '…' : '') : '—'}</td>
                        <td className="px-2 sm:px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{formatDate(r.updated_at)}</td>
                        {canWrite && (
                          <td className="px-2 sm:px-4 py-3 text-right whitespace-nowrap">
                            <button type="button" className="text-sky-600 hover:underline text-xs mr-2" onClick={() => openEdit(r)}>編集</button>
                            {deleteId === r.id ? (
                              <>
                                <button type="button" className="text-red-600 text-xs font-medium mr-1" onClick={() => handleDelete(r.id)}>削除する</button>
                                <button type="button" className="text-gray-500 text-xs" onClick={() => setDeleteId(null)}>キャンセル</button>
                              </>
                            ) : (
                              <button type="button" className="text-red-500 hover:underline text-xs" onClick={() => setDeleteId(r.id)}>削除</button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {modalOpen && canWrite && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={closeModal}>
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-lg border border-gray-100 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-medium text-gray-800 border-b border-gray-100 pb-3">{editId ? '日報を編集' : '日報を作成'}</h2>
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className={labelClass}>店舗 *</label>
                  <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className={inputClass} required disabled={!!editId}>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {editId && <p className="mt-1 text-xs text-gray-500">店舗・日付は編集できません（別日は新規作成してください）</p>}
                </div>
                <div>
                  <label className={labelClass}>日付 *</label>
                  <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className={inputClass} required disabled={!!editId} />
                </div>
                <div>
                  <label className={labelClass}>本文</label>
                  <textarea value={content} onChange={(e) => setContent(e.target.value)} className={inputClass} rows={8} placeholder="本日の内容を入力" />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 disabled:opacity-60">
                    {saving ? '送信中…' : '保存'}
                  </button>
                  <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50">キャンセル</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
