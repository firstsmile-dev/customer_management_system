export type CastOverviewTargetType = 'Daily' | 'Monthly';

export interface CastOverviewTarget {
  id: string;
  target_type: CastOverviewTargetType;
  target_date: string;
  target_amount: number;
  achieved_amount: number;
  achievement_percent: number | null;
}

export interface CastOverviewRow {
  staff_id: string;
  user_id: string;
  email: string;
  username: string;
  store_id: string;
  store_name: string;
  hourly_wage: number;
  current_month_commission: number;
  last_month_commission: number;
  targets: CastOverviewTarget[];
}

export interface StoreCastOverviewResponse {
  casts: CastOverviewRow[];
}
