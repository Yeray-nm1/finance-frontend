"use client";

import { X } from "lucide-react";
import type { SubscriptionFilterProps } from "@/types/filter";

export function SubscriptionTags({
  subscriptionIds,
  subscriptions,
  onChange,
}: Readonly<SubscriptionFilterProps>) {
  if (subscriptionIds.length === 0) return null;

  return (
    <>
      {subscriptions
        .filter((s) => subscriptionIds.includes(s.id))
        .map((sub) => (
          <span
            key={sub.id}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-gray-500 bg-gray-100 border border-gray-200"
          >
            {sub.name}
            <button
              onClick={() => {
                onChange(subscriptionIds.filter((id) => id !== sub.id));
              }}
              className="text-gray-400 hover:text-red-500 transition-colors"
              aria-label={`Quitar filtro ${sub.name}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
    </>
  );
}
