import { request } from './client';
import type { Category } from '@/types/categories';

export const categories = {
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
};
