import { request } from './client';
import type { Subscription, SubscriptionCandidate, SubscriptionConflict } from '@/types/subscriptions';

export const subscriptions = {
  list: (signal?: AbortSignal) => request<Subscription[]>('/subscriptions', { signal }),

  create: (data: { name: string; amount: number; frequency: string; transactionId?: string }) =>
    request<Subscription>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<{ name: string; amount: number; frequency: string; matchDescriptions: string[] }>) =>
    request<Subscription>(`/subscriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => request<void>(`/subscriptions/${id}`, { method: 'DELETE' }),

  detect: () => request<{ candidates: SubscriptionCandidate[] }>('/subscriptions/detect'),

  saveDetected: (candidates: Array<{ name: string; amount: number; frequency: string }>) =>
    request<{ created: number }>('/subscriptions/detect/save', {
      method: 'POST',
      body: JSON.stringify({ candidates }),
    }),

  unlinkTransactions: (id: string) =>
    request<void>(`/subscriptions/${id}/unlink-transactions`, { method: 'POST' }),

  dismissPriceChanges: (id: string) =>
    request<void>(`/subscriptions/${id}/dismiss-price-changes`, { method: 'POST' }),

  confirmMatch: (id: string, description: string, transactionId?: string) =>
    request<Subscription>(`/subscriptions/${id}/confirm-match`, {
      method: 'POST',
      body: JSON.stringify({ description, transactionId }),
    }),

  getConflicts: () => request<SubscriptionConflict[]>('/subscriptions/conflicts'),

  resolveConflict: (id: string, subscriptionId: string) =>
    request<void>(`/subscriptions/conflicts/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ subscriptionId }),
    }),
};
