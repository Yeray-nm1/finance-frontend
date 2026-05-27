"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown } from "lucide-react";
import type { SubscriptionFilterProps } from "@/types/filter";

export function SubscriptionFilter({
  subscriptionIds,
  subscriptions,
  onChange,
}: Readonly<SubscriptionFilterProps>) {
  const [open, setOpen] = useState(false);

  function toggle(id: string) {
    if (subscriptionIds.includes(id)) {
      onChange(subscriptionIds.filter((s) => s !== id));
    } else {
      onChange([...subscriptionIds, id]);
    }
  }

  const label = subscriptionIds.length > 0
    ? `Suscripciones (${subscriptionIds.length})`
    : "Suscripciones";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`h-9 justify-between text-left font-normal ${subscriptionIds.length > 0 ? "text-text-primary" : "text-text-muted"}`}
        >
          {label}
          <ChevronDown className="ml-2 size-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-2" align="start">
        {subscriptions.length === 0 ? (
          <p className="text-sm text-text-muted p-2">No hay suscripciones</p>
        ) : (
          <div className="space-y-1">
            {subscriptions.map((sub) => (
              <label
                key={sub.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-bg-muted cursor-pointer text-sm"
              >
                <Checkbox
                  checked={subscriptionIds.includes(sub.id)}
                  onCheckedChange={() => toggle(sub.id)}
                />
                {sub.name}
              </label>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
