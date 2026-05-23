"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash2 } from "lucide-react";
import type { SubscriptionCardProps } from "@/types/subscriptions";
import { formatCurrency } from "@/lib/format";
import { freqLabels } from "@/lib/constants";

export function SubscriptionCard({
  subscription,
  onEdit,
  onDelete,
}: Readonly<SubscriptionCardProps>) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-text-primary truncate">
              {subscription.name}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              {formatCurrency(subscription.amount)} · {freqLabels[subscription.frequency]}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Pencil className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="size-4 text-expense" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
