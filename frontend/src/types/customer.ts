export interface Store {
  id: string;
  name: string;
  store_type: string;
  address: string;
  is_active: boolean;
}

export interface CustomerFormData {
  store: string;
  name: string;
  first_visit: string;
  contact_info: { line_id?: string; instagram?: string; phone?: string };
  preferences: { cigarette_brand?: string; smoking_type?: string; visit_days?: string };
  total_spend: string;
}

export interface CustomerProfileFormData {
  birthday: string;
  zodiac: string;
  animal_fortune: string;
}

export interface CustomerDetailFormData {
  blood_type: string;
  birthplace: string;
  appearance_memo: string;
  company_name: string;
  job_title: string;
  job_description: string;
  work_location: string;
  monthly_income: string;
  monthly_drinking_budget: string;
  residence_type: string;
  nearest_station: string;
  has_lover: boolean;
  marital_status: string;
  children_info: string;
}

export interface CustomerPreferenceFormData {
  alcohol_strength: string;
  favorite_food: string;
  dislike_food: string;
  hobby: string;
  favorite_brand: string;
}
