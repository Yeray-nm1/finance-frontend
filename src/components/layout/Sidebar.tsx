"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Wallet,
  Tags,
  ArrowLeftRight,
  PiggyBank,
  Repeat,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Cuentas", icon: Wallet },
  { href: "/categories", label: "Categorías", icon: Tags },
  { href: "/transactions", label: "Transacciones", icon: ArrowLeftRight },
  { href: "/budgets", label: "Presupuestos", icon: PiggyBank },
  { href: "/subscriptions", label: "Suscripciones", icon: Repeat },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white/70 backdrop-blur-md border-r border-lavender-light p-6 flex flex-col shadow-soft hidden md:flex">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-semibold text-gray-800">
          Finance
        </h1>
        <p className="text-xs text-gray-400 mt-1">{user?.email}</p>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className="w-full justify-start gap-3 rounded-2xl"
              >
                <Icon className="size-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      <Button
        variant="outline"
        className="w-full justify-start gap-3 rounded-2xl"
        onClick={logout}
      >
        <LogOut className="size-4" />
        Cerrar sesión
      </Button>
    </aside>
  );
}
