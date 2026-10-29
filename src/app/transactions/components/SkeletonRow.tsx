"use client";

import { TableRow, TableCell } from "@/components/ui/table";

export function SkeletonRow() {
  return (
    <TableRow>
      {[1, 2, 3, 4, 5, 6, 7].map((cell) => (
        <TableCell key={`skeleton-cell-${cell}`}>
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
        </TableCell>
      ))}
    </TableRow>
  );
}
