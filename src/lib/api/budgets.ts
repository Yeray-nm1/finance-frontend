import { request, requestNullable } from './client';
import type { BudgetWithCategory, MonthlyBudget, IncomeGroup } from '@/types/budgets';

export const budgets = {
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
};
