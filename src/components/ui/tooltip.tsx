"use client";

import * as RadixTooltip from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

export const TooltipProvider = RadixTooltip.Provider;
export const Tooltip = RadixTooltip.Root;
export const TooltipTrigger = RadixTooltip.Trigger;
export const TooltipContent = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof RadixTooltip.Content>) => (
  <RadixTooltip.Portal>
    <RadixTooltip.Content
      className={cn(
        "bg-white border border-border rounded-lg shadow-sm px-3 py-1.5 text-sm text-text-primary",
        className
      )}
      sideOffset={8}
      {...props}
    />
  </RadixTooltip.Portal>
);
