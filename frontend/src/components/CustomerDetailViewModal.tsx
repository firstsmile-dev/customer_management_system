import React, { useState, useEffect } from 'react';
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

interface CustomerDetailViewModalProps {
  customerId: string;
  onClose: () => void;
  onSaved?: () => void;
  onDeleted?: () => void;
}

export default function CustomerDetailViewModal({
  customerId,
  onClose,
  onSaved,
  onDeleted,
}: CustomerDetailViewModalProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CustomerProfileFormData | null>(null);
  const [detail, setDetail] = useState<CustomerDetailFormData | null>(null);
  const [preference, setPreference] = useState<CustomerPreferenceFormData | null>(null);
  const [editProfile, setEditProfile] = useState<CustomerProfileFormData>(initialProfile);
  const [editDetail, setEditDetail] = useState<CustomerDetailFormData>(initialDetail);
  const [editPreference, setEditPreference] = useState<CustomerPreferenceFormData>(initialPreference);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = (path: string) => `${API}/${path}/${customerId}/`;

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileRes, detailRes, prefRes] = await Promise.allSettled([
          axios.get(baseUrl('customer-profiles')),
          axios.get(baseUrl('customer-details')),
          axios.get(baseUrl('customer-preferences')),
        ]);
        const p = profileRes.status === 'fulfilled' ? profileRes.value.data : null;
        const d = detailRes.status === 'fulfilled' ? detailRes.value.data : null;
        const pr = prefRes.status === 'fulfilled' ? prefRes.value.data : null;
        setProfile(p);
        setDetail(d);
        setPreference(pr);
        setEditProfile(p ? { birthday: p.birthday, zodiac: p.zodiac, animal_fortune: p.animal_fortune } : initialProfile);
        setEditDetail(
          d
            ? {
                blood_type: d.blood_type || '',
                birthplace: d.birthplace || '',
                appearance_memo: d.appearance_memo || '',
                company_name: d.company_name || '',
                job_title: d.job_title || '',
                job_description: d.job_description || '',
                work_location: d.work_location || '',
                monthly_income: String(d.monthly_income ?? ''),
                monthly_drinking_budget: String(d.monthly_drinking_budget ?? ''),
                residence_type: d.residence_type || 'Own',
                nearest_station: d.nearest_station || '',
                has_lover: d.has_lover ?? false,
                marital_status: d.marital_status || 'Single',
                children_info: d.children_info || '',
              }
            : initialDetail
        );
        setEditPreference(
          pr
            ? {
                alcohol_strength: pr.alcohol_strength || 'Medium',
                favorite_food: pr.favorite_food || '',
                dislike_food: pr.dislike_food || '',
                hobby: pr.hobby || '',
                favorite_brand: pr.favorite_brand || '',
              }
            : initialPreference
        );
      } catch {
        setError('Failed to load detailed information.');
      }
      setLoading(false);
    };
    fetchAll();
  }, [customerId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (profile) {
        await axios.patch(baseUrl('customer-profiles'), editProfile);
      } else {
        await axios.post(`${API}/customer-profiles/`, { customer: customerId, ...editProfile });
      }
      if (detail) {
        await axios.patch(baseUrl('customer-details'), {
          ...editDetail,
          monthly_income: parseInt(editDetail.monthly_income, 10) || 0,
          monthly_drinking_budget: parseInt(editDetail.monthly_drinking_budget, 10) || 0,
        });
      } else {
        await axios.post(`${API}/customer-details/`, {
          customer: customerId,
          ...editDetail,
          monthly_income: parseInt(editDetail.monthly_income, 10) || 0,
          monthly_drinking_budget: parseInt(editDetail.monthly_drinking_budget, 10) || 0,
        });
      }
      if (preference) {
        await axios.patch(baseUrl('customer-preferences'), editPreference);
      } else {
        await axios.post(`${API}/customer-preferences/`, { customer: customerId, ...editPreference });
      }
      setProfile(editProfile);
      setDetail(editDetail);
      setPreference(editPreference);
      setMode('view');
      onSaved?.();
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? String(err.response?.data?.detail ?? err.message) : 'Failed to save.');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setError(null);
    setDeleting(true);
    try {
      await axios.delete(baseUrl('customer-profiles')).catch(() => {});
      await axios.delete(baseUrl('customer-details')).catch(() => {});
      await axios.delete(baseUrl('customer-preferences')).catch(() => {});
      onDeleted?.();
      onClose();
    } catch {
      setError('Failed to delete.');
    }
    setDeleting(false);
    setConfirmDelete(false);
  };

  const hasAny = profile || detail || preference;
  const isEmpty = !loading && !hasAny;

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={onClose}>
        <div className="rounded-2xl bg-white p-8 shadow-soft" onClick={(e) => e.stopPropagation()}>
          <p className="text-gray-500">読み込み中…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-soft border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-sakura-50/80 backdrop-blur">
          <h2 className="text-lg font-medium text-gray-800">詳細情報</h2>
          <button type="button" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100" onClick={onClose} aria-label="閉じる">×</button>
        </div>
        <div className="p-5 space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {confirmDelete ? (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
              <p className="text-sm text-red-800">詳細情報をすべて削除しますか？</p>
              <div className="mt-3 flex gap-2">
                <button type="button" className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm" onClick={handleDelete} disabled={deleting}>{deleting ? '削除中…' : '削除する'}</button>
                <button type="button" className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm" onClick={() => setConfirmDelete(false)}>キャンセル</button>
              </div>
            </div>
          ) : mode === 'view' ? (
            <>
              {isEmpty && <p className="text-sm text-gray-500">詳細情報はまだ登録されていません。</p>}
              {profile && (
                <section className="rounded-xl border border-gray-100 bg-sakura-50/30 p-4">
                  <h3 className="text-sm font-medium text-gray-700 border-b border-gray-100 pb-2">プロフィール</h3>
                  <dl className="mt-2 space-y-1 text-sm">
                    <div><dt className="text-gray-500">誕生日</dt><dd>{profile.birthday}</dd></div>
                    <div><dt className="text-gray-500">星座</dt><dd>{profile.zodiac}</dd></div>
                    <div><dt className="text-gray-500">干支</dt><dd>{profile.animal_fortune}</dd></div>
                  </dl>
                </section>
              )}
              {detail && (
                <section className="rounded-xl border border-gray-100 bg-sakura-50/30 p-4">
                  <h3 className="text-sm font-medium text-gray-700 border-b border-gray-100 pb-2">詳細</h3>
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div><dt className="text-gray-500">血液型</dt><dd>{detail.blood_type}</dd></div>
                    <div><dt className="text-gray-500">出身地</dt><dd>{detail.birthplace}</dd></div>
                    <div className="col-span-2"><dt className="text-gray-500">会社名</dt><dd>{detail.company_name}</dd></div>
                    <div><dt className="text-gray-500">職種</dt><dd>{detail.job_title}</dd></div>
                    <div><dt className="text-gray-500">婚姻</dt><dd>{detail.marital_status}</dd></div>
                  </dl>
                </section>
              )}
              {preference && (
                <section className="rounded-xl border border-gray-100 bg-sakura-50/30 p-4">
                  <h3 className="text-sm font-medium text-gray-700 border-b border-gray-100 pb-2">嗜好</h3>
                  <dl className="mt-2 space-y-1 text-sm">
                    <div><dt className="text-gray-500">お酒</dt><dd>{preference.alcohol_strength}</dd></div>
                    <div><dt className="text-gray-500">好きな食べ物</dt><dd>{preference.favorite_food}</dd></div>
                    <div><dt className="text-gray-500">趣味</dt><dd>{preference.hobby}</dd></div>
                  </dl>
                </section>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                <button type="button" className="px-4 py-2 rounded-xl bg-sakura-400 text-white text-sm font-medium hover:bg-sakura-500" onClick={() => setMode('edit')}>編集</button>
                {hasAny && <button type="button" className="px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm hover:bg-red-50" onClick={() => setConfirmDelete(true)}>削除</button>}
                <button type="button" className="px-4 py-2 rounded-xl border border-gray-200 text-sm" onClick={onClose}>閉じる</button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              <section className="rounded-xl border border-gray-100 bg-sakura-50/30 p-4 space-y-3">
                <h3 className="text-sm font-medium text-gray-700 border-b border-gray-100 pb-2">プロフィール</h3>
                <div><label className={labelClass}>誕生日</label><input type="date" value={editProfile.birthday} onChange={(e) => setEditProfile((p) => ({ ...p, birthday: e.target.value }))} className={inputClass} /></div>
                <div><label className={labelClass}>星座</label><input type="text" value={editProfile.zodiac} onChange={(e) => setEditProfile((p) => ({ ...p, zodiac: e.target.value }))} className={inputClass} /></div>
                <div><label className={labelClass}>干支</label><input type="text" value={editProfile.animal_fortune} onChange={(e) => setEditProfile((p) => ({ ...p, animal_fortune: e.target.value }))} className={inputClass} /></div>
              </section>
              <section className="rounded-xl border border-gray-100 bg-sakura-50/30 p-4 space-y-3">
                <h3 className="text-sm font-medium text-gray-700 border-b border-gray-100 pb-2">詳細</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelClass}>血液型</label><input type="text" value={editDetail.blood_type} onChange={(e) => setEditDetail((d) => ({ ...d, blood_type: e.target.value }))} className={inputClass} /></div>
                  <div><label className={labelClass}>出身地</label><input type="text" value={editDetail.birthplace} onChange={(e) => setEditDetail((d) => ({ ...d, birthplace: e.target.value }))} className={inputClass} /></div>
                </div>
                <div><label className={labelClass}>会社名</label><input type="text" value={editDetail.company_name} onChange={(e) => setEditDetail((d) => ({ ...d, company_name: e.target.value }))} className={inputClass} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelClass}>職種</label><input type="text" value={editDetail.job_title} onChange={(e) => setEditDetail((d) => ({ ...d, job_title: e.target.value }))} className={inputClass} /></div>
                  <div><label className={labelClass}>勤務地</label><input type="text" value={editDetail.work_location} onChange={(e) => setEditDetail((d) => ({ ...d, work_location: e.target.value }))} className={inputClass} /></div>
                </div>
                <div><label className={labelClass}>月収</label><input type="number" value={editDetail.monthly_income} onChange={(e) => setEditDetail((d) => ({ ...d, monthly_income: e.target.value }))} className={inputClass} /></div>
                <div><label className={labelClass}>居住</label><select value={editDetail.residence_type} onChange={(e) => setEditDetail((d) => ({ ...d, residence_type: e.target.value }))} className={inputClass}><option value="Own">持家</option><option value="Rent">賃貸</option><option value="Other">その他</option></select></div>
                <div><label className={labelClass}>婚姻状況</label><select value={editDetail.marital_status} onChange={(e) => setEditDetail((d) => ({ ...d, marital_status: e.target.value }))} className={inputClass}><option value="Single">独身</option><option value="Married">既婚</option><option value="Divorced">離婚</option><option value="Widowed">死別</option></select></div>
                <label className="flex items-center gap-2"><input type="checkbox" checked={editDetail.has_lover} onChange={(e) => setEditDetail((d) => ({ ...d, has_lover: e.target.checked }))} className="rounded border-gray-300 text-sakura-400" /><span className="text-sm">恋人がいる</span></label>
              </section>
              <section className="rounded-xl border border-gray-100 bg-sakura-50/30 p-4 space-y-3">
                <h3 className="text-sm font-medium text-gray-700 border-b border-gray-100 pb-2">嗜好</h3>
                <div><label className={labelClass}>お酒の強さ</label><select value={editPreference.alcohol_strength} onChange={(e) => setEditPreference((p) => ({ ...p, alcohol_strength: e.target.value }))} className={inputClass}><option value="Weak">弱い</option><option value="Medium">普通</option><option value="Strong">強い</option></select></div>
                <div><label className={labelClass}>好きな食べ物</label><textarea value={editPreference.favorite_food} onChange={(e) => setEditPreference((p) => ({ ...p, favorite_food: e.target.value }))} className={inputClass} rows={2} /></div>
                <div><label className={labelClass}>趣味</label><textarea value={editPreference.hobby} onChange={(e) => setEditPreference((p) => ({ ...p, hobby: e.target.value }))} className={inputClass} rows={2} /></div>
              </section>
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-sakura-400 text-white text-sm font-medium hover:bg-sakura-500 disabled:opacity-60">{saving ? '保存中…' : '保存'}</button>
                <button type="button" className="px-4 py-2 rounded-xl border border-gray-200 text-sm" onClick={() => setMode('view')}>キャンセル</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
