import { request } from './client';
import type {
  AcceptGoalContributionResult,
  PendingGoalContribution,
} from '@/types/goals';

export const goalContributions = {
  getPending: (token: string) =>
    request<PendingGoalContribution>(
      `/goal-contributions/pending?token=${encodeURIComponent(token)}`
    ),
  accept: (
    token: string,
    accountId: string,
    amount: number,
    updateSuggestion: boolean
  ) =>
    request<AcceptGoalContributionResult>('/goal-contributions/accept', {
      method: 'POST',
      body: JSON.stringify({ token, accountId, amount, updateSuggestion }),
    }),
};
