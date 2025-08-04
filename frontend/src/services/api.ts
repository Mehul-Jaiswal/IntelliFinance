import axios from 'axios';
import { 
  User, 
  Account, 
  Transaction, 
  Budget, 
  Goal, 
  AuthTokens, 
  LoginCredentials, 
  RegisterData,
  AIResponse,
  CategorySummary,
  BudgetSummary,
  GoalSummary,
  FinancialInsight
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthTokens & { user: User }> => {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthTokens & { user: User }> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  refreshToken: async (): Promise<AuthTokens> => {
    const response = await api.post('/auth/refresh');
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getProfile: async (): Promise<User> => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<{ message: string; user: User }> => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },
};

// Accounts API
export const accountsAPI = {
  getAccounts: async (): Promise<{ accounts: Account[]; total_accounts: number }> => {
    const response = await api.get('/accounts/');
    return response.data;
  },

  getAccount: async (accountId: number): Promise<Account> => {
    const response = await api.get(`/accounts/${accountId}`);
    return response.data;
  },

  createAccount: async (data: {
    name: string;
    account_type: string;
    institution_name?: string;
    is_manual?: boolean;
  }): Promise<{ message: string; account: Account }> => {
    const response = await api.post('/accounts/', data);
    return response.data;
  },

  updateAccount: async (
    accountId: number,
    data: { name?: string; current_balance?: number }
  ): Promise<{ message: string; account: Account }> => {
    const response = await api.put(`/accounts/${accountId}`, data);
    return response.data;
  },

  deleteAccount: async (accountId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/accounts/${accountId}`);
    return response.data;
  },
};

// Transactions API
export const transactionsAPI = {
  getTransactions: async (params?: {
    account_id?: number;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    transactions: Transaction[];
    count: number;
    offset: number;
    limit: number;
  }> => {
    const response = await api.get('/transactions/', { params });
    return response.data;
  },

  getTransaction: async (transactionId: number): Promise<Transaction> => {
    const response = await api.get(`/transactions/${transactionId}`);
    return response.data;
  },

  createTransaction: async (data: {
    account_id: number;
    amount: number;
    transaction_type: 'debit' | 'credit';
    description: string;
    merchant_name?: string;
    category?: string;
    transaction_date?: string;
  }): Promise<{ message: string; transaction: Transaction }> => {
    const response = await api.post('/transactions/', data);
    return response.data;
  },

  updateTransaction: async (
    transactionId: number,
    data: {
      category?: string;
      description?: string;
      notes?: string;
    }
  ): Promise<{ message: string; transaction: Transaction }> => {
    const response = await api.put(`/transactions/${transactionId}`, data);
    return response.data;
  },

  deleteTransaction: async (transactionId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/transactions/${transactionId}`);
    return response.data;
  },

  getCategorySummary: async (params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<{
    categories: CategorySummary;
    total_categories: number;
    period: { start_date?: string; end_date?: string };
  }> => {
    const response = await api.get('/transactions/categories/summary', { params });
    return response.data;
  },
};

// Budgets API
export const budgetsAPI = {
  getBudgets: async (params?: { is_active?: boolean }): Promise<{
    budgets: Budget[];
    total_budgets: number;
  }> => {
    const response = await api.get('/budgets/', { params });
    return response.data;
  },

  createBudget: async (data: {
    name: string;
    category: string;
    amount: number;
    period?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<{ message: string; budget: Budget }> => {
    const response = await api.post('/budgets/', data);
    return response.data;
  },

  updateBudget: async (
    budgetId: number,
    data: {
      name?: string;
      amount?: number;
      is_active?: boolean;
    }
  ): Promise<{ message: string; budget: Budget }> => {
    const response = await api.put(`/budgets/${budgetId}`, data);
    return response.data;
  },

  deleteBudget: async (budgetId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/budgets/${budgetId}`);
    return response.data;
  },

  getGoals: async (params?: { is_active?: boolean }): Promise<{
    goals: Goal[];
    total_goals: number;
  }> => {
    const response = await api.get('/budgets/goals', { params });
    return response.data;
  },

  createGoal: async (data: {
    name: string;
    description?: string;
    target_amount: number;
    target_date?: string;
  }): Promise<{ message: string; goal: Goal }> => {
    const response = await api.post('/budgets/goals', data);
    return response.data;
  },

  updateGoal: async (
    goalId: number,
    data: {
      current_amount?: number;
      target_amount?: number;
      is_active?: boolean;
    }
  ): Promise<{ message: string; goal: Goal }> => {
    const response = await api.put(`/budgets/goals/${goalId}`, data);
    return response.data;
  },

  deleteGoal: async (goalId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/budgets/goals/${goalId}`);
    return response.data;
  },

  getSummary: async (): Promise<{
    budgets: BudgetSummary;
    goals: GoalSummary;
  }> => {
    const response = await api.get('/budgets/summary');
    return response.data;
  },
};

// AI Assistant API
export const aiAPI = {
  chat: async (message: string): Promise<{
    response: AIResponse;
    query: string;
  }> => {
    const response = await api.post('/ai/chat', { message });
    return response.data;
  },

  getSuggestions: async (): Promise<{
    suggestions: string[];
    categories: Array<{
      name: string;
      queries: string[];
    }>;
  }> => {
    const response = await api.get('/ai/suggestions');
    return response.data;
  },

  getInsights: async (): Promise<{
    insights: FinancialInsight[];
    generated_at: string;
  }> => {
    const response = await api.get('/ai/insights');
    return response.data;
  },
};

export default api;
