"use client";

import { TableRow, TableCell } from "@/components/ui/table";

export function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 7 }).map((_, i) => (
        <TableCell key={`skeleton-cell-${i}`}>
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
        </TableCell>
      ))}
    </TableRow>
  );
}
