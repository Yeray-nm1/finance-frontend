import { Home, PartyPopper, PiggyBank, Package } from "lucide-react";
export { formatCurrency } from "@/lib/format";

export const typeLabels: Record<string, string> = {
  needs: "Necesidades",
  leisure: "Ocio",
  savings: "Ahorro",
  other: "Otros",
};

export const typeIcons: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
  needs: { icon: <Home size={16} />, bg: "bg-amber-100", color: "text-amber-700" },
  leisure: { icon: <PartyPopper size={16} />, bg: "bg-pink-100", color: "text-pink-700" },
  savings: { icon: <PiggyBank size={16} />, bg: "bg-green-100", color: "text-green-700" },
  other: { icon: <Package size={16} />, bg: "bg-sky-100", color: "text-sky-700" },
};

export const typeBg: Record<string, string> = {
  needs: "bg-amber-100",
  leisure: "bg-pink-100",
  savings: "bg-green-100",
  other: "bg-sky-100",
};

