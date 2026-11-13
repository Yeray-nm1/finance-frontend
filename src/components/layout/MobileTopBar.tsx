"use client";

import { Menu } from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";

export function MobileTopBar() {
  const { openMobile } = useSidebar();

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-border bg-white px-4 md:hidden">
      <button
        type="button"
        onClick={openMobile}
        aria-label="Abrir menu"
        aria-controls="app-sidebar"
        className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-white text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
      >
        <Menu size={18} />
      </button>
      <span className="text-sm font-bold tracking-wide text-text-primary">FINANCE</span>
    </header>
  );
}
