import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CustomerDetailModal from '../components/CustomerDetailModal';
import type { Store, CustomerFormData } from '../types/customer';

const API = '/api';

const initialForm: CustomerFormData = {
  store: '',
  name: '',
  first_visit: '',
  contact_info: {},
  preferences: {},
  total_spend: '0',
};

const inputClass =
  'mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-800 shadow-sm focus:border-sakura-300 focus:ring-1 focus:ring-sakura-300 sm:text-sm';
const labelClass = 'block text-sm font-medium text-gray-700';

export default function CustomerRegistration() {
  const [stores, setStores] = useState<Store[]>([]);
  const [form, setForm] = useState<CustomerFormData>(initialForm);
  const [createdCustomerId, setCreatedCustomerId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    axios
      .get<Store[]>(`${API}/stores/`)
      .then((res) => setStores(res.data))
      .catch(() => setStores([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      const payload = {
        store: form.store,
        name: form.name,
        first_visit: form.first_visit,
        contact_info: form.contact_info,
        preferences: form.preferences,
        total_spend: form.total_spend,
      };
      const res = await axios.post(`${API}/customers/`, payload);
      setCreatedCustomerId(res.data.id);
      setSuccess(true);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data && typeof err.response.data === 'object' && 'detail' in err.response.data
          ? String((err.response.data as { detail?: unknown }).detail)
          : err.message)
        : 'Failed to create customer';
      setError(String(msg));
    }
    setSubmitting(false);
  };

  const openDetailModal = () => {
    if (createdCustomerId) setShowDetailModal(true);
  };

  return (
    <div className="min-h-screen bg-sakura-50/50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-xl sm:text-2xl font-medium text-gray-800 tracking-tight">
          お客様登録
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          基本情報を入力後、必要に応じて詳細を登録できます。
        </p>

        <form onSubmit={handleSubmit} className="mt-8 sm:mt-10">
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 rounded-lg bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-800">
              登録が完了しました。
            </div>
          )}

          <div className="rounded-2xl bg-white/80 backdrop-blur shadow-soft border border-white/60 p-6 sm:p-8 space-y-6">
            <div>
              <label className={labelClass}>店舗 *</label>
              <select
                value={form.store}
                onChange={(e) => setForm((f) => ({ ...f, store: e.target.value }))}
                required
                className={inputClass}
              >
                <option value="">選択してください</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>お名前 *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className={inputClass}
                placeholder="山田 花子"
              />
            </div>

            <div>
              <label className={labelClass}>初回来店日 *</label>
              <input
                type="date"
                value={form.first_visit}
                onChange={(e) => setForm((f) => ({ ...f, first_visit: e.target.value }))}
                required
                className={inputClass}
              />
            </div>

            <fieldset className="rounded-xl border border-gray-100 bg-white/50 p-4 sm:p-5 space-y-4">
              <legend className="text-sm font-medium text-gray-700 px-1">連絡先</legend>
              <div>
                <label className={labelClass}>LINE ID</label>
                <input
                  type="text"
                  value={form.contact_info?.line_id || ''}
                  onChange={(e) => setForm((f) => ({ ...f, contact_info: { ...f.contact_info, line_id: e.target.value } }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Instagram</label>
                <input
                  type="text"
                  value={form.contact_info?.instagram || ''}
                  onChange={(e) => setForm((f) => ({ ...f, contact_info: { ...f.contact_info, instagram: e.target.value } }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>電話番号</label>
                <input
                  type="text"
                  value={form.contact_info?.phone || ''}
                  onChange={(e) => setForm((f) => ({ ...f, contact_info: { ...f.contact_info, phone: e.target.value } }))}
                  className={inputClass}
                />
              </div>
            </fieldset>

            <fieldset className="rounded-xl border border-gray-100 bg-white/50 p-4 sm:p-5 space-y-4">
              <legend className="text-sm font-medium text-gray-700 px-1">嗜好（任意）</legend>
              <div>
                <label className={labelClass}>タバコの銘柄</label>
                <input
                  type="text"
                  value={form.preferences?.cigarette_brand || ''}
                  onChange={(e) => setForm((f) => ({ ...f, preferences: { ...f.preferences, cigarette_brand: e.target.value } }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>喫煙タイプ</label>
                <input
                  type="text"
                  value={form.preferences?.smoking_type || ''}
                  onChange={(e) => setForm((f) => ({ ...f, preferences: { ...f.preferences, smoking_type: e.target.value } }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>来店希望曜日</label>
                <input
                  type="text"
                  value={form.preferences?.visit_days || ''}
                  onChange={(e) => setForm((f) => ({ ...f, preferences: { ...f.preferences, visit_days: e.target.value } }))}
                  className={inputClass}
                  placeholder="土日など"
                />
              </div>
            </fieldset>

            <div>
              <label className={labelClass}>累計利用額（円）</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.total_spend}
                onChange={(e) => setForm((f) => ({ ...f, total_spend: e.target.value }))}
                className={inputClass}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-sakura-400 text-white text-sm font-medium shadow-soft hover:bg-sakura-500 focus:ring-2 focus:ring-sakura-300 focus:ring-offset-2 disabled:opacity-60 transition-colors"
              >
                {submitting ? '登録中…' : '登録する'}
              </button>
            </div>
          </div>
        </form>

        {success && createdCustomerId && (
          <div className="mt-8 pt-8 border-t border-gray-100">
            <button
              type="button"
              onClick={openDetailModal}
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 rounded-xl border-2 border-sakura-300 bg-white text-sakura-500 text-sm font-medium hover:bg-sakura-50 transition-colors"
            >
              詳細情報を入力する
            </button>
          </div>
        )}

        {showDetailModal && createdCustomerId && (
          <CustomerDetailModal
            customerId={createdCustomerId}
            onClose={() => setShowDetailModal(false)}
            onSaved={() => setSuccess(true)}
          />
        )}
      </div>
    </div>
  );
}
