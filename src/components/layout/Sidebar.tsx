"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/contexts/SidebarContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import { ChevronLeft, ChevronRight, Upload, X } from "lucide-react";
import { CsvUploadDialog } from "@/components/CsvUploadDialog";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/navigation";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isCollapsed, toggleCollapsed, isMobileOpen, closeMobile } = useSidebar();
  const isMobile = useIsMobile();
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const asideRef = useRef<HTMLElement>(null);

  const collapsed = !isMobile && isCollapsed;
  const drawerOpen = isMobile && isMobileOpen;

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "U";

  useEffect(() => {
    if (!drawerOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobile();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = asideRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [drawerOpen, closeMobile]);

  const handleNavClick = () => {
    if (isMobile) {
      closeMobile();
      return;
    }
    if (!isCollapsed) {
      toggleCollapsed();
    }
  };

  return (
    <>
      {drawerOpen && (
        <button
          type="button"
          aria-label="Cerrar menu"
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
        />
      )}

      <aside
        ref={asideRef}
        id="app-sidebar"
        role={isMobile ? "dialog" : undefined}
        aria-modal={drawerOpen ? true : undefined}
        aria-label="Navegacion principal"
        inert={isMobile && !drawerOpen ? true : undefined}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-border bg-white transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:sticky md:top-0",
          drawerOpen ? "translate-x-0 shadow-xl" : "-translate-x-full md:translate-x-0",
          isMobile ? "w-60" : collapsed ? "w-16" : "w-60"
        )}
      >
        <div className={cn(
          "flex items-center",
          collapsed ? "justify-center px-3 pt-6 pb-4" : "justify-between px-4 pt-6 pb-4"
        )}>
          <span className="text-lg font-bold text-text-primary">
            {collapsed ? userInitial : "FINANCE"}
          </span>
          {isMobile ? (
            <button
              ref={closeButtonRef}
              onClick={closeMobile}
              aria-label="Cerrar menu"
              className="rounded-md p-1 text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
            >
              <X size={18} />
            </button>
          ) : (
            !collapsed && (
              <button
                onClick={toggleCollapsed}
                aria-label="Contraer menu"
                className="rounded-md p-1 text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
              >
                <ChevronLeft size={16} />
              </button>
            )
          )}
        </div>

        {user?.email && !collapsed && (
          <p className="mb-4 truncate px-4 text-[11px] text-text-secondary">
            {user.email}
          </p>
        )}

        <nav className="flex-1 overflow-y-auto px-2">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                onClick={handleNavClick}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center rounded-md text-[13px] no-underline transition-all mb-0.5",
                  collapsed ? "justify-center py-2.5" : "justify-start py-2.5 px-3",
                  active
                    ? "text-primary bg-primary-light border-l-2 border-primary font-semibold"
                    : "text-text-secondary border-l-2 border-transparent font-normal hover:text-text-primary hover:bg-bg-elevated",
                  !collapsed && active && "border-l-2 border-primary",
                  collapsed && active && "border-l-0"
                )}
              >
                {collapsed ? (
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
              collapsed ? "justify-center py-2.5" : "justify-start py-2.5 px-3"
            )}
            title={collapsed ? "Subir extracto" : undefined}
          >
            <Upload size={collapsed ? 18 : 14} strokeWidth={1.5} className={cn(collapsed ? "" : "mr-2")} />
            {!collapsed && "Subir extracto"}
          </button>

          {!collapsed && (
            <button
              onClick={logout}
              className="flex items-center justify-start w-full bg-none border-none text-text-secondary cursor-pointer text-[13px] py-2.5 px-3 hover:text-expense transition-colors"
            >
              Cerrar sesion
            </button>
          )}

          {!isMobile && collapsed && (
            <button
              onClick={toggleCollapsed}
              title="Expandir sidebar"
              aria-label="Expandir menu"
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
