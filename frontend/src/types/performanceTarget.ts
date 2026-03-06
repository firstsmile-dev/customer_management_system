export type TargetType = 'Daily' | 'Monthly';

export interface PerformanceTarget {
  id: string;
  staff: string;
  target_amount: string;
  target_type: TargetType;
  target_date: string;
}

export interface PerformanceTargetFormData {
  staff: string;
  target_amount: string;
  target_type: TargetType;
  target_date: string;
}

export const TARGET_TYPES: TargetType[] = ['Daily', 'Monthly'];
