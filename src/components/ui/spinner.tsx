"use client";

import type { ReactNode } from "react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: ReactNode;
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-4",
  lg: "h-12 w-12 border-4",
};

export function Spinner({ size = "md", className = "", children }: SpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div
        className={`inline-block animate-spin rounded-full border-solid border-emerald-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${sizeClasses[size]}`}
        role="status"
      >
        <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
          Cargando...
        </span>
      </div>
      {children && (
        <p className="font-serif text-lg text-gray-600">{children}</p>
      )}
    </div>
  );
}
