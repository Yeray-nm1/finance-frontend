import { request } from './client';
import type { Subscription, SubscriptionCandidate } from '@/types/subscriptions';

export const subscriptions = {
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
};
