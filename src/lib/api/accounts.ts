import { request } from './client';
import type { Account } from '@/types/accounts';

export const accounts = {
  list: (signal?: AbortSignal) => request<Account[]>('/accounts', { signal }),
  create: (data: { name: string; type: string }) =>
    request<Account>('/accounts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<{ name: string; type: string }>) =>
    request<Account>(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/accounts/${id}`, { method: 'DELETE' }),
};
