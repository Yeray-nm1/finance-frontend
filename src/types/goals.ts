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
  /** Día del mes (1-28) en que se envía el recordatorio mensual. */
  reminderDay: number | null;
  /** Importe sugerido para la aportación; se puede editar al confirmar. */
  reminderAmount: number | null;
  /** Aviso mensual de esta meta; el switch global sigue siendo el maestro. */
  reminderEnabled: boolean;
}

export interface GoalInput {
  name: string;
  targetAmount: number;
  targetDate?: string | null;
  accountId?: string | null;
  reminderDay?: number | null;
  reminderAmount?: number | null;
  reminderEnabled?: boolean;
}

export interface GoalContributionInput {
  amount: number;
  date: string;
  accountId: string;
}

export interface GoalContributionAccount {
  id: string;
  name: string;
  type: "checking" | "savings";
}

/** Aportación pendiente que el usuario debe confirmar desde el correo. */
export interface PendingGoalContribution {
  id: string;
  /** Meta de la aportación, para filtrar los movimientos al confirmarla. */
  goalId: string;
  /** Sugerencia de la meta; null cuando no se configuró importe. */
  amount: number | null;
  period: string;
  goalName: string;
  status: string;
  goalAccountId: string;
  accounts: GoalContributionAccount[];
}

export interface AcceptGoalContributionResult {
  id: string;
  status: string;
  /** Importe confirmado, para el comprobante de la aceptación reciente. */
  amount?: number | null;
  sourceAccountId?: string | null;
  alreadyAccepted: boolean;
}
