const API_BASE = '/api/v1';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// Types
import type {
  User,
  Account,
  Category,
  Transaction,
  CreateTransactionDTO,
  BudgetWithCategory,
  Subscription,
  SubscriptionCandidate,
  DashboardResponse,
} from '@/types';

export const api = {
  auth: {
    register: (email: string, password: string) =>
      request<{ user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    login: (email: string, password: string) =>
      request<{ user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<{ user: User }>('/auth/me'),
    logout: () => request<void>('/auth/logout', { method: 'POST' }),
  },

  accounts: {
    list: () => request<Account[]>('/accounts'),
    create: (data: { name: string; type: string }) =>
      request<Account>('/accounts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ name: string; type: string }>) =>
      request<Account>(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/accounts/${id}`, { method: 'DELETE' }),
  },

  categories: {
    list: () => request<Category[]>('/categories'),
    create: (data: { name: string; type: string }) =>
      request<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ name: string; type: string }>) =>
      request<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
  },

  transactions: {
    list: () => request<Transaction[]>('/transactions'),
    create: (data: CreateTransactionDTO) =>
      request<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(data) }),
    importCsv: (rows: Record<string, string>[]) =>
      request<{ imported: number; total: number }>('/transactions/import', {
        method: 'POST',
        body: JSON.stringify({ rows }),
      }),
  },

  budgets: {
    list: () => request<BudgetWithCategory[]>('/budgets'),
    create: (data: { categoryId: string; percentage: number }) =>
      request<BudgetWithCategory>('/budgets', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ categoryId: string; percentage: number }>) =>
      request<BudgetWithCategory>(`/budgets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/budgets/${id}`, { method: 'DELETE' }),
  },

  subscriptions: {
    list: () => request<Subscription[]>('/subscriptions'),
    create: (data: { name: string; amount: number; frequency: string }) =>
      request<Subscription>('/subscriptions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<{ name: string; amount: number; frequency: string }>) =>
      request<Subscription>(`/subscriptions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/subscriptions/${id}`, { method: 'DELETE' }),
    detect: () => request<{ candidates: SubscriptionCandidate[] }>('/subscriptions/detect'),
    autoDetect: () => request<{ detected: number }>('/subscriptions/detect', { method: 'POST' }),
  },

  dashboard: {
    get: (year?: number, month?: number) => {
      const params = new URLSearchParams();
      if (year) params.set('year', String(year));
      if (month) params.set('month', String(month));
      const qs = params.toString();
      return request<DashboardResponse>(`/dashboard${qs ? `?${qs}` : ''}`);
    },
  },
};
