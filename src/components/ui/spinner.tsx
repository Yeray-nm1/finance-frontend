"use client";

import type { ReactNode } from "react";
import { spinnerSizeClasses } from "./variants/spinner.variants";

interface SpinnerProps {
  size?: keyof typeof spinnerSizeClasses;
  className?: string;
  children?: ReactNode;
}

export function Spinner({ size = "md", className = "", children }: Readonly<SpinnerProps>) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <output
        className={`inline-block animate-spin rounded-full border-solid border-emerald-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${spinnerSizeClasses[size]}`}
      >
        <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
          Cargando...
        </span>
      </output>
      {children && (
        <p className="font-serif text-lg text-gray-600">{children}</p>
      )}
    </div>
  );
}
