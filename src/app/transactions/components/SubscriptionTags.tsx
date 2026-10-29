"use client";

import { X } from "lucide-react";
import type { SubscriptionFilterProps } from "./types/filter.types";

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
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-text-muted bg-bg-elevated border border-border"
          >
            {sub.name}
            <button
              onClick={() => {
                onChange(subscriptionIds.filter((id) => id !== sub.id));
              }}
              className="text-text-muted hover:text-expense transition-colors"
              aria-label={`Quitar filtro ${sub.name}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
    </>
  );
}
