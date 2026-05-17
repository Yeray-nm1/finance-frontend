const API_BASE = '/api/v1';

async function request<T>(path: string, options?: RequestInit & { signal?: AbortSignal }): Promise<T> {
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

async function requestNullable<T>(path: string, options?: RequestInit & { signal?: AbortSignal }): Promise<T | null> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}

import type {
  User,
  Account,
  Category,
  Transaction,
  CreateTransactionDTO,
  BudgetWithCategory,
  MonthlyBudget,
  Subscription,
  SubscriptionCandidate,
  DashboardResponse,
  IncomeGroup,
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
    me: (signal?: AbortSignal) => request<{ user: User }>('/auth/me', { signal }),
    logout: () => request<void>('/auth/logout', { method: 'POST' }),
  },

  accounts: {
    list: (signal?: AbortSignal) => request<Account[]>('/accounts', { signal }),
    create: (data: { name: string; type: string }) =>
      request<Account>('/accounts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ name: string; type: string }>) =>
      request<Account>(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/accounts/${id}`, { method: 'DELETE' }),
  },

  categories: {
    list: (params?: { search?: string; page?: number; limit?: number }, signal?: AbortSignal) => {
      const qs = new URLSearchParams()
      if (params?.search) qs.set('search', params.search)
      if (params?.page) qs.set('page', String(params.page))
      if (params?.limit) qs.set('limit', String(params.limit))
      const query = qs.toString()
      return request<Category[]>(`/categories${query ? `?${query}` : ''}`, { signal })
    },
    create: (data: { name: string; type: string }) =>
      request<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ name: string; type: string }>) =>
      request<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
  },

  transactions: {
    list: (signal?: AbortSignal) => request<Transaction[]>('/transactions', { signal }),
    create: (data: CreateTransactionDTO) =>
      request<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(data) }),
    importCsv: (rows: Record<string, string>[]) =>
      request<{ imported: number; total: number }>('/transactions/import', {
        method: 'POST',
        body: JSON.stringify({ rows }),
      }),
    deleteMany: (ids: string[]) =>
      request<{ deleted: number }>(`/transactions/batch?ids=${ids.join(',')}`, { method: 'DELETE' }),
  },

  budgets: {
    list: (year?: number, month?: number, signal?: AbortSignal) => {
      const params = new URLSearchParams();
      if (year) params.set('year', String(year));
      if (month) params.set('month', String(month));
      const qs = params.toString();
      return request<BudgetWithCategory[]>(`/budgets${qs ? `?${qs}` : ''}`, { signal });
    },
    create: (data: { categoryId: string; percentage: number }) =>
      request<BudgetWithCategory>('/budgets', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ categoryId: string; percentage: number }>) =>
      request<BudgetWithCategory>(`/budgets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/budgets/${id}`, { method: 'DELETE' }),
    calculateIncome: (month: number, year: number) => {
      const params = new URLSearchParams();
      params.set('month', String(month));
      params.set('year', String(year));
      return request<IncomeGroup[]>(`/budgets/calculate-income?${params.toString()}`);
    },
    monthly: {
      get: (month: number, year: number) => {
        const params = new URLSearchParams();
        params.set('month', String(month));
        params.set('year', String(year));
        return requestNullable<MonthlyBudget>(`/budgets/monthly?${params.toString()}`);
      },
      upsert: (month: number, year: number, data: { totalIncome: number; typeAllocations: Array<{ type: string; percentage: number }> }) => {
        const params = new URLSearchParams();
        params.set('month', String(month));
        params.set('year', String(year));
        return request<MonthlyBudget>(`/budgets/monthly?${params.toString()}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      },
    },
  },

  subscriptions: {
    list: (signal?: AbortSignal) => request<Subscription[]>('/subscriptions', { signal }),
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
    get: (year?: number, month?: number, signal?: AbortSignal) => {
      const params = new URLSearchParams();
      if (year) params.set('year', String(year));
      if (month) params.set('month', String(month));
      const qs = params.toString();
      return request<DashboardResponse>(`/dashboard${qs ? `?${qs}` : ''}`, { signal });
    },
  },
};
