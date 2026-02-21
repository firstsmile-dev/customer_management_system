export interface DailySummary {
  id: string;
  store: string;
  report_date: string;
  total_sales: string;
  total_expenses: string;
  labor_costs: string;
  notes: string;
}

export interface DailySummaryFormData {
  store: string;
  report_date: string;
  total_sales: string;
  total_expenses: string;
  labor_costs: string;
  notes: string;
}
