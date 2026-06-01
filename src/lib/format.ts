const SHORT_MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${SHORT_MONTHS[d.getMonth()]}`;
}

export function getAmountColor(type: string): string {
  if (type === "income") return "text-income";
  if (type === "expense") return "text-expense";
  return "text-savings";
}

export function getAmountPrefix(type: string): string {
  if (type === "income") return "+";
  if (type === "expense") return "-";
  return "↔";
}
