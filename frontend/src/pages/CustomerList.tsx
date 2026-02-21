import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CustomerDetailViewModal from '../components/CustomerDetailViewModal';
import type { Customer, Store, CustomerFormData } from '../types/customer';

const API = '/api';

const inputClass =
  'mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-800 shadow-sm focus:border-sky-300 focus:ring-1 focus:ring-sky-300 text-sm';
const labelClass = 'block text-sm font-medium text-gray-700';

const iconClass = 'w-4 h-4 shrink-0 inline-block align-middle';

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
const IconDetail = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
const IconFilter = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);
const IconClear = () => (
  <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState('');
  const [filterStore, setFilterStore] = useState('');
  const [detailModalId, setDetailModalId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CustomerFormData | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = () => {
    axios.get<Customer[]>(`${API}/customers/`).then((res) => setCustomers(res.data)).catch(() => setCustomers([]));
  };

  useEffect(() => {
    setLoading(true);
    axios.get<Store[]>(`${API}/stores/`).then((res) => setStores(res.data)).catch(() => setStores([]));
    fetchCustomers();
    setLoading(false);
  }, []);

  const storeName = (id: string) => stores.find((s) => s.id === id)?.name ?? id.slice(0, 8);

  const filteredCustomers = React.useMemo(() => {
    return customers.filter((c) => {
      const matchName = !filterName.trim() || c.name.toLowerCase().includes(filterName.trim().toLowerCase());
      const matchStore = !filterStore || c.store === filterStore;
      return matchName && matchStore;
    });
  }, [customers, filterName, filterStore]);

  const clearFilters = () => {
    setFilterName('');
    setFilterStore('');
  };

  const hasActiveFilters = Boolean(filterName.trim() || filterStore);

  const openEdit = (c: Customer) => {
    setEditId(c.id);
    setEditForm({
      store: c.store,
      name: c.name,
      first_visit: c.first_visit,
      contact_info: (c.contact_info as Record<string, string>) || {},
      preferences: (c.preferences as Record<string, string>) || {},
      total_spend: String(c.total_spend),
    });
    setError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId || !editForm) return;
    setSaving(true);
    setError(null);
    try {
      await axios.patch(`${API}/customers/${editId}/`, {
        store: editForm.store,
        name: editForm.name,
        first_visit: editForm.first_visit,
        contact_info: editForm.contact_info,
        preferences: editForm.preferences,
        total_spend: editForm.total_spend,
      });
      fetchCustomers();
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
      await axios.delete(`${API}/customers/${id}/`);
      fetchCustomers();
      setDeleteConfirmId(null);
      if (viewId === id) setViewId(null);
    } catch {
      setError('Failed to delete.');
    }
  };

  return (
    <div className="min-h-screen bg-sky-50/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-xl sm:text-2xl font-medium text-gray-800 tracking-tight">お客様一覧</h1>
        <p className="mt-1 text-sm text-gray-500">お客様の閲覧・編集・削除、および詳細情報の確認ができます。</p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="mt-8 text-gray-500">読み込み中…</p>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-white/90 px-4 py-3 shadow-soft">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <IconFilter /> 絞り込み
              </span>
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="名前で検索"
                className="flex-1 min-w-[140px] max-w-[200px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-sky-300 focus:ring-1 focus:ring-sky-300"
              />
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
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  title="クリア"
                  aria-label="絞り込みをクリア"
                  className="p-1.5 rounded-lg text-sky-600 hover:text-sky-700 hover:bg-sky-50 transition-colors"
                >
                  <IconClear />
                </button>
              )}
              <span className="text-sm text-gray-500">
                {filteredCustomers.length}件{customers.length !== filteredCustomers.length && ` / 全${customers.length}件`}
              </span>
            </div>
            <div className="mt-3 overflow-x-auto rounded-xl border border-gray-100 bg-white/90 shadow-soft">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="px-4 py-3 font-medium text-gray-700">名前</th>
                  <th className="px-4 py-3 font-medium text-gray-700">店舗</th>
                  <th className="px-4 py-3 font-medium text-gray-700">初回来店</th>
                  <th className="px-4 py-3 font-medium text-gray-700">累計利用額</th>
                  <th className="px-4 py-3 font-medium text-gray-700 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">{hasActiveFilters ? '条件に一致する登録がありません' : '登録がありません'}</td></tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-sky-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                      <td className="px-4 py-3 text-gray-600">{storeName(c.store)}</td>
                      <td className="px-4 py-3 text-gray-600">{c.first_visit}</td>
                      <td className="px-4 py-3 text-gray-600">{c.total_spend} 円</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-1 sm:gap-2 items-center">
                          <button type="button" className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 text-xs sm:text-sm" onClick={() => setViewId(c.id)}><IconView />表示</button>
                          <button type="button" className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-800 text-xs sm:text-sm" onClick={() => openEdit(c)}><IconEdit />編集</button>
                          <button type="button" className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 text-xs sm:text-sm font-medium" onClick={() => setDetailModalId(c.id)}><IconDetail />詳細</button>
                          {deleteConfirmId === c.id ? (
                            <>
                              <button type="button" className="inline-flex items-center gap-1 text-red-600 text-xs sm:text-sm font-medium" onClick={() => handleDelete(c.id)}><IconCheck />削除する</button>
                              <button type="button" className="inline-flex items-center gap-1 text-gray-500 text-xs sm:text-sm" onClick={() => setDeleteConfirmId(null)}><IconClose />キャンセル</button>
                            </>
                          ) : (
                            <button type="button" className="inline-flex items-center gap-1 text-red-500 hover:text-red-600 text-xs sm:text-sm" onClick={() => setDeleteConfirmId(c.id)}><IconDelete />削除</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </>
        )}

        {viewId && (() => {
          const c = customers.find((x) => x.id === viewId);
          if (!c) return null;
          const ci = (c.contact_info as Record<string, string>) || {};
          const pr = (c.preferences as Record<string, string>) || {};
          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => setViewId(null)}>
              <div className="w-full max-w-md rounded-2xl bg-white shadow-soft border border-gray-100 p-6" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-lg font-medium text-gray-800 border-b border-gray-100 pb-3">お客様情報</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  <div><dt className="text-gray-500">名前</dt><dd className="font-medium">{c.name}</dd></div>
                  <div><dt className="text-gray-500">店舗</dt><dd>{storeName(c.store)}</dd></div>
                  <div><dt className="text-gray-500">初回来店</dt><dd>{c.first_visit}</dd></div>
                  <div><dt className="text-gray-500">累計利用額</dt><dd>{c.total_spend} 円</dd></div>
                  {(ci.line_id || ci.instagram || ci.phone) && (
                    <div><dt className="text-gray-500">連絡先</dt><dd>LINE: {ci.line_id || '—'} / IG: {ci.instagram || '—'} / TEL: {ci.phone || '—'}</dd></div>
                  )}
                  {(pr.cigarette_brand || pr.visit_days) && (
                    <div><dt className="text-gray-500">嗜好</dt><dd>タバコ: {pr.cigarette_brand || '—'} / 来店希望: {pr.visit_days || '—'}</dd></div>
                  )}
                </dl>
                <div className="mt-4 flex gap-2">
                  <button type="button" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 text-white text-sm hover:bg-sky-600" onClick={() => { setViewId(null); openEdit(c); }}><IconEdit />編集</button>
                  <button type="button" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50" onClick={() => setViewId(null)}><IconClose />閉じる</button>
                </div>
              </div>
            </div>
          );
        })()}

        {editId && editForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => { setEditId(null); setEditForm(null); }}>
            <div className="w-full max-w-md rounded-2xl bg-white shadow-soft border border-gray-100 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-medium text-gray-800 border-b border-gray-100 pb-3">お客様を編集</h2>
              <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
                <div>
                  <label className={labelClass}>店舗</label>
                  <select value={editForm.store} onChange={(e) => setEditForm((f) => (f ? { ...f, store: e.target.value } : null))} className={inputClass} required>
                    {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>名前</label>
                  <input type="text" value={editForm.name} onChange={(e) => setEditForm((f) => (f ? { ...f, name: e.target.value } : null))} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>初回来店日</label>
                  <input type="date" value={editForm.first_visit} onChange={(e) => setEditForm((f) => (f ? { ...f, first_visit: e.target.value } : null))} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>累計利用額（円）</label>
                  <input type="number" step="0.01" min="0" value={editForm.total_spend} onChange={(e) => setEditForm((f) => (f ? { ...f, total_spend: e.target.value } : null))} className={inputClass} />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 disabled:opacity-60">{saving ? '保存中…' : <><IconSave />保存</>}</button>
                  <button type="button" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50" onClick={() => { setEditId(null); setEditForm(null); }}><IconClose />キャンセル</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {detailModalId && (
          <CustomerDetailViewModal
            customerId={detailModalId}
            onClose={() => setDetailModalId(null)}
            onSaved={() => fetchCustomers()}
            onDeleted={() => setDetailModalId(null)}
          />
        )}
      </div>
    </div>
  );
}
