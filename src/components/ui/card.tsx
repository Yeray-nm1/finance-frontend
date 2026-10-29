import * as React from "react"
import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-white border border-border rounded-lg",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, children, ...props }: Readonly<React.ComponentProps<"h3">>) {
  return (
    <h3 data-slot="card-title" className={cn("font-semibold text-base leading-none", className)} {...props}>
      {children}
    </h3>
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-sm text-text-secondary", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("p-5 pt-0", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardTitle,
  CardDescription,
  CardContent,
}
