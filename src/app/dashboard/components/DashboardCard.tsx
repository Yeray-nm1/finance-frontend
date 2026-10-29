"use client";

import Link from "next/link";
import type { DashboardCardProps } from "./types/DashboardCard.types";

export function DashboardCard({ title, emptyText, href, linkText, isEmpty, children }: Readonly<DashboardCardProps>) {
  return (
    <section className="bg-white border border-border rounded-lg p-5 flex flex-col">
      <h2 className="text-xs uppercase tracking-widest text-text-muted mb-5">{title}</h2>

      {isEmpty ? (
        <p className="text-xs text-text-muted flex-1 flex items-center justify-center">{emptyText}</p>
      ) : (
        <div className="mb-4 flex-1">{children}</div>
      )}

      <Link
        href={href}
        className="block text-center text-xs bg-primary text-white font-bold rounded-md px-3 py-1.5 hover:bg-primary/90 transition-colors mt-auto"
      >
        {linkText}
      </Link>
    </section>
  );
}
