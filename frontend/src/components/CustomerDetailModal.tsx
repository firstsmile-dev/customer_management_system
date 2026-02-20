import React, { useState } from 'react';
import axios from 'axios';
import type {
  CustomerProfileFormData,
  CustomerDetailFormData,
  CustomerPreferenceFormData,
} from '../types/customer';

const API = '/api';

const initialProfile: CustomerProfileFormData = {
  birthday: '',
  zodiac: '',
  animal_fortune: '',
};

const initialDetail: CustomerDetailFormData = {
  blood_type: '',
  birthplace: '',
  appearance_memo: '',
  company_name: '',
  job_title: '',
  job_description: '',
  work_location: '',
  monthly_income: '',
  monthly_drinking_budget: '',
  residence_type: 'Own',
  nearest_station: '',
  has_lover: false,
  marital_status: 'Single',
  children_info: '',
};

const initialPreference: CustomerPreferenceFormData = {
  alcohol_strength: 'Medium',
  favorite_food: '',
  dislike_food: '',
  hobby: '',
  favorite_brand: '',
};

const inputClass =
  'mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-800 shadow-sm focus:border-sakura-300 focus:ring-1 focus:ring-sakura-300 text-sm';
const labelClass = 'block text-sm font-medium text-gray-700';

interface CustomerDetailModalProps {
  customerId: string;
  onClose: () => void;
  onSaved?: () => void;
}

export default function CustomerDetailModal({ customerId, onClose, onSaved }: CustomerDetailModalProps) {
  const [profile, setProfile] = useState<CustomerProfileFormData>(initialProfile);
  const [detail, setDetail] = useState<CustomerDetailFormData>(initialDetail);
  const [preference, setPreference] = useState<CustomerPreferenceFormData>(initialPreference);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await axios.post(`${API}/customer-profiles/`, {
        customer: customerId,
        ...profile,
      });
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.detail || err.message : 'Failed to save profile';
      setError(String(msg));
      setSaving(false);
      return;
    }
    try {
      await axios.post(`${API}/customer-details/`, {
        customer: customerId,
        ...detail,
        monthly_income: parseInt(detail.monthly_income, 10) || 0,
        monthly_drinking_budget: parseInt(detail.monthly_drinking_budget, 10) || 0,
      });
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.detail || err.message : 'Failed to save detail';
      setError(String(msg));
      setSaving(false);
      return;
    }
    try {
      await axios.post(`${API}/customer-preferences/`, {
        customer: customerId,
        ...preference,
      });
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.detail || err.message : 'Failed to save preferences';
      setError(String(msg));
      setSaving(false);
      return;
    }
    setSaving(false);
    onSaved?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-soft border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-sakura-50/80 backdrop-blur">
          <h2 className="text-lg font-medium text-gray-800">詳細情報</h2>
          <button
            type="button"
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            onClick={onClose}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSaveAll} className="p-5 space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <section className="rounded-xl border border-gray-100 bg-sakura-50/30 p-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-700 border-b border-gray-100 pb-2">プロフィール</h3>
            <div>
              <label className={labelClass}>誕生日</label>
              <input type="date" value={profile.birthday} onChange={(e) => setProfile((p) => ({ ...p, birthday: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>星座</label>
              <input type="text" value={profile.zodiac} onChange={(e) => setProfile((p) => ({ ...p, zodiac: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>干支</label>
              <input type="text" value={profile.animal_fortune} onChange={(e) => setProfile((p) => ({ ...p, animal_fortune: e.target.value }))} className={inputClass} />
            </div>
          </section>

          <section className="rounded-xl border border-gray-100 bg-sakura-50/30 p-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-700 border-b border-gray-100 pb-2">詳細</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>血液型</label>
                <input type="text" value={detail.blood_type} onChange={(e) => setDetail((d) => ({ ...d, blood_type: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>出身地</label>
                <input type="text" value={detail.birthplace} onChange={(e) => setDetail((d) => ({ ...d, birthplace: e.target.value }))} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>外見メモ</label>
              <textarea value={detail.appearance_memo} onChange={(e) => setDetail((d) => ({ ...d, appearance_memo: e.target.value }))} className={inputClass} rows={2} />
            </div>
            <div>
              <label className={labelClass}>会社名</label>
              <input type="text" value={detail.company_name} onChange={(e) => setDetail((d) => ({ ...d, company_name: e.target.value }))} className={inputClass} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>職種</label>
                <input type="text" value={detail.job_title} onChange={(e) => setDetail((d) => ({ ...d, job_title: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>勤務地</label>
                <input type="text" value={detail.work_location} onChange={(e) => setDetail((d) => ({ ...d, work_location: e.target.value }))} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>仕事内容</label>
              <textarea value={detail.job_description} onChange={(e) => setDetail((d) => ({ ...d, job_description: e.target.value }))} className={inputClass} rows={2} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>月収（円）</label>
                <input type="number" value={detail.monthly_income} onChange={(e) => setDetail((d) => ({ ...d, monthly_income: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>飲み代予算（円/月）</label>
                <input type="number" value={detail.monthly_drinking_budget} onChange={(e) => setDetail((d) => ({ ...d, monthly_drinking_budget: e.target.value }))} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>居住</label>
                <select value={detail.residence_type} onChange={(e) => setDetail((d) => ({ ...d, residence_type: e.target.value }))} className={inputClass}>
                  <option value="Own">持家</option>
                  <option value="Rent">賃貸</option>
                  <option value="Other">その他</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>最寄り駅</label>
                <input type="text" value={detail.nearest_station} onChange={(e) => setDetail((d) => ({ ...d, nearest_station: e.target.value }))} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>婚姻状況</label>
                <select value={detail.marital_status} onChange={(e) => setDetail((d) => ({ ...d, marital_status: e.target.value }))} className={inputClass}>
                  <option value="Single">独身</option>
                  <option value="Married">既婚</option>
                  <option value="Divorced">離婚</option>
                  <option value="Widowed">死別</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>お子様</label>
                <input type="text" value={detail.children_info} onChange={(e) => setDetail((d) => ({ ...d, children_info: e.target.value }))} className={inputClass} placeholder="なし など" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={detail.has_lover} onChange={(e) => setDetail((d) => ({ ...d, has_lover: e.target.checked }))} className="rounded border-gray-300 text-sakura-400 focus:ring-sakura-300" />
              <span className="text-sm text-gray-700">恋人がいる</span>
            </label>
          </section>

          <section className="rounded-xl border border-gray-100 bg-sakura-50/30 p-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-700 border-b border-gray-100 pb-2">嗜好</h3>
            <div>
              <label className={labelClass}>お酒の強さ</label>
              <select value={preference.alcohol_strength} onChange={(e) => setPreference((p) => ({ ...p, alcohol_strength: e.target.value }))} className={inputClass}>
                <option value="Weak">弱い</option>
                <option value="Medium">普通</option>
                <option value="Strong">強い</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>好きな食べ物</label>
              <textarea value={preference.favorite_food} onChange={(e) => setPreference((p) => ({ ...p, favorite_food: e.target.value }))} className={inputClass} rows={2} />
            </div>
            <div>
              <label className={labelClass}>苦手な食べ物</label>
              <textarea value={preference.dislike_food} onChange={(e) => setPreference((p) => ({ ...p, dislike_food: e.target.value }))} className={inputClass} rows={2} />
            </div>
            <div>
              <label className={labelClass}>趣味</label>
              <textarea value={preference.hobby} onChange={(e) => setPreference((p) => ({ ...p, hobby: e.target.value }))} className={inputClass} rows={2} />
            </div>
            <div>
              <label className={labelClass}>好きなブランド</label>
              <input type="text" value={preference.favorite_brand} onChange={(e) => setPreference((p) => ({ ...p, favorite_brand: e.target.value }))} className={inputClass} />
            </div>
          </section>

          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-sakura-400 text-white text-sm font-medium shadow-soft hover:bg-sakura-500 disabled:opacity-60 transition-colors"
            >
              {saving ? '保存中…' : 'すべて保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
