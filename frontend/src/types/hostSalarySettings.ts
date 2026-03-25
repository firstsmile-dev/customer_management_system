export type HostRoundingMode = 'Round' | 'Floor' | 'Ceil';

export interface HostSalarySetting {
  id: string;
  store: string;
  tax_rate: string; // decimal string like "0.1000"
  service_rate: string; // decimal string like "0.2000"
  rounding_mode: HostRoundingMode;
  updated_at: string;
}

export interface HostSalaryPreview {
  year: number;
  month: number;
  store_id: string;
  store_name: string;
  tax_rate: string;
  service_rate: string;
  rounding_mode: HostRoundingMode;
  groups: number;
  total_sales: number;
  subtotal_estimated: number;
  total_from_subtotal_estimated: number;
}

