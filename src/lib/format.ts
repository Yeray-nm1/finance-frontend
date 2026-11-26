const SHORT_MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    useGrouping: true,
  }).format(amount);
}

export function formatAmountNumber(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(amount);
}

export function formatSignedAmount(amount: number): string {
  const sign = amount >= 0 ? "+" : "−";
  return `${sign} ${formatAmountNumber(Math.abs(amount))}`;
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${SHORT_MONTHS[d.getMonth()]}`;
}

export function getAmountPrefix(type: string): string {
  if (type === "income") return "+";
  if (type === "expense") return "-";
  return "↔";
}
