import { clampProgress } from "@/lib/goals";

interface GoalProgressBarProps {
  readonly value: number;
  readonly done?: boolean;
}

export function GoalProgressBar({ value, done = false }: GoalProgressBarProps) {
  const progress = clampProgress(value);

  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-bg-elevated"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none ${
          done ? "bg-income" : "bg-primary"
        }`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
