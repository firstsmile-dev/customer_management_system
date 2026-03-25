export interface DailyReport {
  id: string;
  store: string;
  report_date: string;
  content: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
