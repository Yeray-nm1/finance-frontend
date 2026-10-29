export function getAmountColor(type: string): string {
  if (type === "income") return "text-income";
  if (type === "expense") return "text-expense";
  return "text-savings";
}
