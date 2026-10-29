export interface BalanceCardProps {
  income: number;
  expenses: number;
  savings: number;
  available: number;
  balance: number;
  vsPreviousMonth?: { percentage: number; amountDiff: number };
}
