import type { ReactNode } from "react";

export interface DashboardCardProps {
  title: string;
  emptyText: string;
  href: string;
  linkText: string;
  isEmpty: boolean;
  children: ReactNode;
}
