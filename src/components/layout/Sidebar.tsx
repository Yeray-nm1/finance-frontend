"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { ChevronLeft, ChevronRight, Upload, LayoutDashboard, PiggyBank, Repeat, ArrowLeftRight, Settings } from "lucide-react";
import { CsvUploadDialog } from "@/components/CsvUploadDialog";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/budgets", label: "Presupuestos", icon: PiggyBank },
  { href: "/subscriptions", label: "Suscripciones", icon: Repeat },
  { href: "/transactions", label: "Transacciones", icon: ArrowLeftRight },
  { href: "/preferences", label: "Preferencias", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isCollapsed, toggleCollapsed } = useSidebar();
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "U";

  const handleNavClick = () => {
    if (!isCollapsed) {
      toggleCollapsed();
    }
  };

  return (
    <>
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={toggleCollapsed}
        />
      )}

      <aside
        className={cn(
          "h-screen bg-white border-r border-border flex flex-col transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isCollapsed ? "sticky top-0 w-16" : "fixed left-0 top-0 z-40 w-60"
        )}
      >
        <div className={cn(
          "flex items-center",
          isCollapsed ? "justify-center px-3 pt-6 pb-4" : "justify-between px-4 pt-6 pb-4"
        )}>
          <span className="text-lg font-bold text-text-primary">
            {isCollapsed ? userInitial : "FINANCE"}
          </span>
          {!isCollapsed && (
            <button onClick={toggleCollapsed} className="bg-none border-none text-text-secondary cursor-pointer p-1 hover:text-text-primary transition-colors">
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {user?.email && !isCollapsed && (
          <p className="text-[11px] text-text-secondary px-4 mb-4 overflow-hidden text-ellipsis whitespace-nowrap">
            {user.email}
          </p>
        )}

        <nav className="flex-1 overflow-y-auto px-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center rounded-md text-[13px] no-underline transition-all mb-0.5",
                  isCollapsed ? "justify-center py-2.5" : "justify-start py-2.5 px-3",
                  active
                    ? "text-primary bg-primary-light border-l-2 border-primary font-semibold"
                    : "text-text-secondary border-l-2 border-transparent font-normal hover:text-text-primary hover:bg-gray-50",
                  !isCollapsed && active && "border-l-2 border-primary",
                  isCollapsed && active && "border-l-0"
                )}
              >
                {isCollapsed ? (
                  <Icon size={18} strokeWidth={1.5} />
                ) : (
                  <span>{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-2 pt-4 border-t border-border">
          <button
            onClick={() => setCsvDialogOpen(true)}
            className={cn(
              "flex items-center w-full bg-none border-none text-text-secondary cursor-pointer text-[13px] transition-colors hover:text-primary",
              isCollapsed ? "justify-center py-2.5" : "justify-start py-2.5 px-3"
            )}
            title={isCollapsed ? "Subir extracto" : undefined}
          >
            <Upload size={isCollapsed ? 18 : 14} strokeWidth={1.5} className={cn(isCollapsed ? "" : "mr-2")} />
            {!isCollapsed && "Subir extracto"}
          </button>

          {!isCollapsed && (
            <button
              onClick={logout}
              className="flex items-center justify-start w-full bg-none border-none text-text-secondary cursor-pointer text-[13px] py-2.5 px-3 hover:text-expense transition-colors"
            >
              Cerrar sesion
            </button>
          )}

          {isCollapsed && (
            <button
              onClick={toggleCollapsed}
              title="Expandir sidebar"
              className="flex justify-center items-center w-full bg-none border-none text-text-secondary cursor-pointer text-[13px] py-3 hover:text-text-primary transition-colors"
            >
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          )}
        </div>
      </aside>

      <CsvUploadDialog
        open={csvDialogOpen}
        onClose={() => setCsvDialogOpen(false)}
        onImported={() => router.refresh()}
      />
    </>
  );
}
