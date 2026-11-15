interface ProgressBarProps {
  value: number;
  color: string;
  label?: string;
}

export function ProgressBar({ value, color, label }: Readonly<ProgressBarProps>) {
  return (
    <progress
      value={Math.round(value)}
      max={100}
      aria-label={label}
      title={label}
      className="w-20 h-2 rounded-sm [&::-webkit-progress-bar]:bg-gray-100 [&::-webkit-progress-value]:rounded-sm [&::-webkit-progress-value]:bg-current [&::-moz-progress-bar]:bg-current"
      style={{ color }}
    />
  );
}
