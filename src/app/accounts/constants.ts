import type { Account } from "@/types/accounts";

export const TYPE_LABELS: Record<Account["type"], string> = {
  checking: "Cuenta corriente",
  savings: "Ahorro",
};
