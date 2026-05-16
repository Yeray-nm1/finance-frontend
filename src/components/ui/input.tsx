import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "bg-white border border-[#e5e7eb] flex h-10 w-full min-w-0 rounded-lg px-4 py-2 text-sm text-[#111827] transition-[color,box-shadow] outline-none placeholder:text-[#9ca3af]",
        "focus-visible:border-[#93c5e8] focus-visible:ring-[3px] focus-visible:ring-[#93c5e8]/30",
        className
      )}
      {...props}
    />
  )
}

export { Input }
