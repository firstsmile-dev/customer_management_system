export interface MonthlyRankingsOverall {
  sales_total: number;
  groups_total: number;
  new_groups_total: number;
}

export interface MonthlyStoreRankingRow {
  store_id: string;
  store_name: string;
  sales: number;
  groups: number;
  new_groups: number;
  rank_sales: number;
  rank_groups: number;
  rank_new_groups: number;
}

export interface MonthlyStoreRankingsResponse {
  year: number;
  month: number;
  overall: MonthlyRankingsOverall;
  by_store: MonthlyStoreRankingRow[];
}
