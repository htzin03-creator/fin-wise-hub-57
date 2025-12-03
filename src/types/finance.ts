// Tipos para o sistema de controle financeiro

export type TransactionType = 'income' | 'expense';
export type CurrencyType = 'BRL' | 'USD';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  is_default: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  description: string;
  amount: number;
  currency: CurrencyType;
  type: TransactionType;
  date: string;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  currency: CurrencyType;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  preferred_currency: CurrencyType;
  created_at: string;
  updated_at: string;
}

// Tipos para formulários
export interface TransactionFormData {
  description: string;
  amount: number;
  currency: CurrencyType;
  type: TransactionType;
  category_id: string;
  date: string;
}

export interface GoalFormData {
  name: string;
  target_amount: number;
  currency: CurrencyType;
  deadline: string | null;
}

export interface CategoryFormData {
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

// Tipos para estatísticas
export interface FinancialStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface CategoryStats {
  category: Category;
  total: number;
  percentage: number;
  count: number;
}

export interface MonthlyStats {
  month: string;
  income: number;
  expense: number;
  balance: number;
}
