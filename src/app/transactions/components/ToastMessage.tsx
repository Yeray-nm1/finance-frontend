"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { ToastMessageProps } from "@/types/transactions";

export function ToastMessage({ message, type, onClose }: Readonly<ToastMessageProps>) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm transition-all ${
        type === "success" ? "bg-green-600" : "bg-red-600"
      }`}
    >
      <div className="flex items-center gap-2">
        <span>{message}</span>
        <button onClick={onClose} className="hover:opacity-80">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
