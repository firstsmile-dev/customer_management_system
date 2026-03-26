export type LedgerEntryType = 'Income' | 'Expense';

export interface PersonalLedgerEntry {
  id: string;
  user: string;
  entry_date: string;
  entry_type: LedgerEntryType;
  amount: number;
  category: string;
  memo: string;
  created_at: string;
  updated_at: string;
}

export interface PersonalLedgerFormData {
  entry_date: string;
  entry_type: LedgerEntryType;
  amount: string;
  category: string;
  memo: string;
}

export interface PersonalLedgerSummary {
  year: number;
  month: number;
  income_total: number;
  expense_total: number;
  balance: number;
  entry_count: number;
}

