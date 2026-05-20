export const CATEGORY_TYPES = ['needs', 'leisure', 'savings', 'other'] as const;
export type CategoryType = (typeof CATEGORY_TYPES)[number];

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
}

export interface CategoryTypeConfig {
  type: CategoryType;
  label: string;
  description: string;
  color: string;
  accent: string;
  textAccent: string;
}

export const CATEGORY_CONFIGS: CategoryTypeConfig[] = [
  { type: "needs", label: "Necesidades", description: "Gastos esenciales", color: "from-emerald-50 to-emerald-100", accent: "bg-emerald-600", textAccent: "text-emerald-700" },
  { type: "leisure", label: "Ocio", description: "Entretenimiento", color: "from-violet-50 to-violet-100", accent: "bg-violet-600", textAccent: "text-violet-700" },
  { type: "savings", label: "Ahorro", description: "Ahorros e inversiones", color: "from-blue-50 to-blue-100", accent: "bg-blue-600", textAccent: "text-blue-700" },
  { type: "other", label: "Otros", description: "Gastos varios", color: "from-amber-50 to-amber-100", accent: "bg-amber-600", textAccent: "text-amber-700" },
];
