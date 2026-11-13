import { request } from './client';
import type {
  GoalContribution,
  GoalContributionInput,
  GoalInput,
  SavingsGoal,
} from '@/types/goals';

export const goals = {
  list: (includeArchived = false, signal?: AbortSignal) =>
    request<SavingsGoal[]>(
      `/goals${includeArchived ? '?includeArchived=true' : ''}`,
      { signal }
    ),
  get: (id: string) => request<SavingsGoal>(`/goals/${id}`),
  create: (data: GoalInput) =>
    request<SavingsGoal>('/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<GoalInput> & { isArchived?: boolean }) =>
    request<SavingsGoal>(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => request<void>(`/goals/${id}`, { method: 'DELETE' }),
  contribute: (id: string, data: GoalContributionInput) =>
    request<GoalContribution>(`/goals/${id}/contributions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteContribution: (goalId: string, transactionId: string) =>
    request<void>(`/goals/${goalId}/contributions/${transactionId}`, {
      method: 'DELETE',
    }),
};
