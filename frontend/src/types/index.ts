export interface User {
  id: number;
  email: string;
  full_name: string;
  currency: string;
  timezone: string;
  is_verified: boolean;
  created_at: string;
}

export interface Account {
  id: number;
  name: string;
  account_type: string;
  institution_name?: string;
  current_balance: number;
  available_balance?: number;
  credit_limit?: number;
  is_manual: boolean;
  sync_status: string;
  last_sync?: string;
  created_at: string;
}

export interface Transaction {
  id: number;
  account_id: number;
  amount: number;
  transaction_type: 'debit' | 'credit';
  description: string;
  merchant_name?: string;
  category: string;
  subcategory?: string;
  transaction_date: string;
  is_pending: boolean;
  is_recurring: boolean;
  is_anomaly: boolean;
  confidence_score?: number;
  notes?: string;
  tags?: string;
  created_at: string;
}

export interface Budget {
  id: number;
  name: string;
  category: string;
  amount: number;
  period: string;
  start_date: string;
  end_date: string;
  spent_amount: number;
  remaining_amount: number;
  percentage_used: number;
  is_active: boolean;
  auto_renew: boolean;
  alert_threshold: number;
  over_budget: boolean;
  created_at: string;
}

export interface Goal {
  id: number;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  remaining_amount: number;
  progress_percentage: number;
  target_date?: string;
  is_active: boolean;
  is_achieved: boolean;
  achieved_date?: string;
  created_at: string;
}

export interface AIResponse {
  type: string;
  message: string;
  [key: string]: any;
}

export interface ChatMessage {
  id: string;
  message: string;
  response: AIResponse;
  timestamp: string;
  isUser: boolean;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name?: string;
}

export interface CategorySummary {
  [category: string]: {
    total: number;
    count: number;
    average: number;
  };
}

export interface BudgetSummary {
  total_budgets: number;
  total_budgeted: number;
  total_spent: number;
  remaining: number;
  over_budget_count: number;
  budget_utilization: number;
}

export interface GoalSummary {
  total_goals: number;
  achieved_goals: number;
  total_target: number;
  total_current: number;
  overall_progress: number;
}

export interface FinancialInsight {
  type: string;
  title: string;
  data: any;
}
