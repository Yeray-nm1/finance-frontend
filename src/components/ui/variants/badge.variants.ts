import { cva } from "class-variance-authority"

export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#005696] text-white border-transparent",
        secondary: "bg-[#d9eaf7] text-[#005696] border-transparent",
        destructive: "bg-[#dc2626] text-white border-transparent",
        outline: "text-[#005696] border-[#93c5e8] bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
