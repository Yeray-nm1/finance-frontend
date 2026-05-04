"use client";

import * as RadixTooltip from "@radix-ui/react-tooltip";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const tooltipContentVariants = cva(
  "bg-white/70 backdrop-blur-md border border-lavender-light rounded-xl shadow-soft px-3 py-1.5 text-sm font-sans text-gray-800",
  {
    variants: {},
    defaultVariants: {},
  }
);

export const TooltipProvider = RadixTooltip.Provider;
export const Tooltip = RadixTooltip.Root;
export const TooltipTrigger = RadixTooltip.Trigger;
export const TooltipContent = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof RadixTooltip.Content>) => (
  <RadixTooltip.Portal>
    <RadixTooltip.Content
      className={cn(tooltipContentVariants(), className)}
      sideOffset={8}
      {...props}
    />
  </RadixTooltip.Portal>
);
