export type PaymentMethod = 'Cash' | 'Credit Card' | 'PayPay';

export interface VisitRecord {
  id: string;
  customer: string;
  cast: string;
  visit_date: string;
  spending: string;
  payment_method: PaymentMethod;
  entry_time: string;
  exit_time: string;
  accompanied: boolean;
  companions: string;
  memo: string;
  unpaid_amount: string;
  received_amount: number;
  unpaid_date: string;
  receipt: boolean;
}

export interface VisitRecordFormData {
  customer: string;
  cast: string;
  visit_date: string;
  spending: string;
  payment_method: PaymentMethod;
  entry_time: string;
  exit_time: string;
  accompanied: boolean;
  companions: string;
  memo: string;
  unpaid_amount: string;
  received_amount: string;
  unpaid_date: string;
  receipt: boolean;
}

export interface StaffMember {
  id: string;
  user: string;
  store: string;
  hourly_wage: string;
  commission_rate: number;
  is_on_duty: boolean;
  check_in: string;
  check_out: string;
}

export const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'Credit Card', 'PayPay'];
