import type { Account } from "./accounts";

export type GoalAccount = Pick<Account, "id" | "name" | "type"> | null;

export interface GoalContribution {
  id: string;
  amount: number;
  date: string;
  description: string;
  account: GoalAccount;
  transferAccount: GoalAccount;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: string | null;
  accountId: string | null;
  account: GoalAccount;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  saved: number;
  progress: number;
  remaining: number;
  monthlyNeeded: number | null;
  contributionsCount: number;
  contributions?: GoalContribution[];
}

export interface GoalInput {
  name: string;
  targetAmount: number;
  targetDate?: string | null;
  accountId?: string | null;
}

export interface GoalContributionInput {
  amount: number;
  date: string;
  accountId: string;
}
