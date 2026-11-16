"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { QuickExpenseDialog } from "./QuickExpenseDialog";
import type { QuickExpenseButtonProps } from "./types/QuickExpense.types";

export function QuickExpenseButton({ onCreated }: Readonly<QuickExpenseButtonProps>) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Añadir gasto rápido"
        className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:bg-primary-hover active:scale-95 md:hidden"
      >
        <Plus className="size-6" />
      </button>
      <QuickExpenseDialog open={open} onOpenChange={setOpen} onCreated={onCreated} />
    </>
  );
}
