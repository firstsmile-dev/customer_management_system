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

export interface StaffMemberFormData {
  user: string;
  store: string;
  hourly_wage: string;
  commission_rate: string;
  is_on_duty: boolean;
  check_in: string;
  check_out: string;
}
