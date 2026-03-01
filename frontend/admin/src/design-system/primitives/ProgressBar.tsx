import { cn } from "@vpn-suite/shared";

export interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  label?: string;
  "aria-label"?: string;
}

export function ProgressBar({
  value,
  max = 100,
  className,
  label,
  "aria-label": ariaLabel,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      className={cn("ds-progress-bar", className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={ariaLabel ?? label ?? `Progress: ${value} of ${max}`}
    >
      <div className="ds-progress-bar__track">
        <div className="ds-progress-bar__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

ProgressBar.displayName = "ProgressBar";
