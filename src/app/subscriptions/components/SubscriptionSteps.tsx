import { cn } from "@/lib/utils";

function Step({ number, label, active }: { number: number; label: string; active: boolean }) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 whitespace-nowrap text-[13px]",
        active ? "font-semibold text-text-primary" : "font-normal text-text-muted"
      )}
    >
      <span
        className={cn(
          "flex size-6 items-center justify-center rounded-full text-xs",
          active
            ? "bg-primary text-white"
            : "border border-text-muted/60 text-text-muted"
        )}
      >
        {number}
      </span>
      {label}
    </span>
  );
}

export function SubscriptionSteps({ current }: Readonly<{ current: 1 | 2 }>) {
  return (
    <div className="flex items-center gap-3" aria-label="Progreso del formulario">
      <Step number={1} label="Datos" active={current === 1} />
      <span className="h-px flex-1 bg-border" aria-hidden="true" />
      <Step number={2} label="Pagos anteriores · opcional" active={current === 2} />
    </div>
  );
}
