import { LayoutDashboard, PiggyBank, Repeat, ArrowLeftRight, Settings, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Cuentas bancarias", icon: Wallet },
  { href: "/budgets", label: "Presupuestos", icon: PiggyBank },
  { href: "/subscriptions", label: "Suscripciones", icon: Repeat },
  { href: "/transactions", label: "Transacciones", icon: ArrowLeftRight },
  { href: "/preferences", label: "Preferencias", icon: Settings },
];
