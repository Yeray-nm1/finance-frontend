import { LayoutDashboard, PiggyBank, Repeat, ArrowLeftRight, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/budgets", label: "Presupuestos", icon: PiggyBank },
  { href: "/subscriptions", label: "Suscripciones", icon: Repeat },
  { href: "/transactions", label: "Transacciones", icon: ArrowLeftRight },
  { href: "/preferences", label: "Preferencias", icon: Settings },
];
