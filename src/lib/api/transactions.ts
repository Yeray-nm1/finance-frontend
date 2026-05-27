import { request } from './client';
import type { Transaction, CreateTransactionDTO, UpdateTransactionDTO } from '@/types/transactions';
import type { TransactionFilters } from '@/types/filter';
import type { PaginatedResponse } from '@/types';

export const transactions = {
  list: (params?: TransactionFilters, signal?: AbortSignal) => {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.type) qs.set('type', params.type)
    if (params?.categoryId) qs.set('categoryId', params.categoryId)
    if (params?.accountId) qs.set('accountId', params.accountId)
    if (params?.dateFrom) qs.set('dateFrom', params.dateFrom)
    if (params?.dateTo) qs.set('dateTo', params.dateTo)
    if (params?.search) qs.set('search', params.search)
    if (params?.subscriptionIds) qs.set('subscriptionIds', params.subscriptionIds)
    if (params?.sortBy) qs.set('sortBy', params.sortBy)
    if (params?.sortOrder) qs.set('sortOrder', params.sortOrder)
    const query = qs.toString()
    return request<PaginatedResponse<Transaction>>(`/transactions${query ? `?${query}` : ''}`, { signal })
  },
  create: (data: CreateTransactionDTO) =>
    request<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  importCsv: (rows: Record<string, string>[]) =>
    request<{ imported: number; total: number }>('/transactions/import', {
      method: 'POST',
      body: JSON.stringify({ rows }),
    }),
  deleteMany: (ids: string[]) =>
    request<{ deleted: number }>(`/transactions/batch?ids=${ids.join(',')}`, { method: 'DELETE' }),
  update: (id: string, data: UpdateTransactionDTO) =>
    request<Transaction>(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/transactions/${id}`, { method: 'DELETE' }),
};
