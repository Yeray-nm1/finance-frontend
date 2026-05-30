"use client";

const SKELETON_KEYS = ["skeleton-0", "skeleton-1", "skeleton-2", "skeleton-3"];

export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {SKELETON_KEYS.map((key) => (
        <div key={key} className="bg-white border border-border rounded-lg p-5 animate-pulse">
          <div className="h-4 w-24 bg-gray-200 rounded mb-5" />
          <div className="space-y-3">
            <div className="h-3 w-full bg-gray-100 rounded" />
            <div className="h-3 w-3/4 bg-gray-100 rounded" />
            <div className="h-3 w-full bg-gray-100 rounded" />
            <div className="h-3 w-1/2 bg-gray-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
