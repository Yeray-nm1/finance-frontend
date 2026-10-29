import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "bg-white border border-border flex h-10 w-full min-w-0 rounded-lg px-4 py-2 text-sm text-text-primary transition-[color,box-shadow] outline-none placeholder:text-text-muted",
        "focus-visible:border-primary-border focus-visible:ring-[3px] focus-visible:ring-primary-border/30",
        className
      )}
      {...props}
    />
  )
}

export { Input }
