export type StoreTargetType = 'Daily' | 'Monthly';

export interface StoreTarget {
  id: string;
  store: string;
  target_type: StoreTargetType;
  /** Daily: YYYY-MM-DD, Monthly: YYYY-MM-01 */
  target_date: string;
  sales_target: string;
  group_target: string;
  new_sales_target: string;
  new_group_target: string;
  created_at: string;
  updated_at: string;
}

export interface StoreTargetFormData {
  store: string;
  target_type: StoreTargetType;
  target_date: string;
  sales_target: string;
  group_target: string;
  new_sales_target: string;
  new_group_target: string;
}

export const STORE_TARGET_TYPES: StoreTargetType[] = ['Daily', 'Monthly'];

