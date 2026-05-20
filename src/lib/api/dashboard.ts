import { request } from './client';
import type { DashboardResponse } from '@/types/dashboard';

export const dashboard = {
  get: (year?: number, month?: number, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (year) params.set('year', String(year));
    if (month) params.set('month', String(month));
    const qs = params.toString();
    return request<DashboardResponse>(`/dashboard${qs ? `?${qs}` : ''}`, { signal });
  },
};
