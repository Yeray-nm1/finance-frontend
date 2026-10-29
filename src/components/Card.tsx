import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("bg-white border border-border rounded-lg p-5", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, children, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn("text-xs uppercase tracking-widest text-text-muted font-semibold mb-4", className)}
      {...props}
    >
      {children}
    </h2>
  );
}
