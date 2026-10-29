import { cn } from "@/lib/utils"
import { badgeVariants } from "./variants/badge.variants"
import type { VariantProps } from "class-variance-authority"

function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
