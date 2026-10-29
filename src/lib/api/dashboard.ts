import { request } from './client';
import type { DashboardResponse } from '@/types/dashboard';

export interface MonthOption {
  year: number;
  month: number;
}

export const dashboard = {
  get: (year?: number, month?: number, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (year) params.set('year', String(year));
    if (month) params.set('month', String(month));
    const qs = params.toString();
    const url = qs ? `/dashboard?${qs}` : '/dashboard';
    return request<DashboardResponse>(url, { signal });
  },

  months: (signal?: AbortSignal) => {
    return request<MonthOption[]>('/dashboard/months', { signal });
  },
};
