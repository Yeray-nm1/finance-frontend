import { cn } from "@/lib/utils"

function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "destructive" | "outline"
}) {
  const variants = {
    default: "bg-lavender text-gray-800 border-transparent",
    secondary: "bg-mint text-gray-800 border-transparent",
    destructive: "bg-coral text-gray-800 border-transparent",
    outline: "text-gray-800 border-lavender bg-transparent",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
