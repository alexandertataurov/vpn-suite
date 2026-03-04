import type { ReactNode } from "react";

type MeterVariant = "info" | "success" | "warning" | "danger";

interface MeterProps {
  label: ReactNode;
  valueLabel: ReactNode;
  /**
   * Percentage 0–100.
   */
  percent: number;
  variant?: MeterVariant;
  className?: string;
}

export function Meter({ label, valueLabel, percent, variant = "info", className = "" }: MeterProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className={["meter-wrap", className || null].filter(Boolean).join(" ")}>
      <div className="meter-label">
        <span>{label}</span>
        <span>{valueLabel}</span>
      </div>
      <div className="meter-track" role="meter">
        <div
          className={["meter-fill", variant].filter(Boolean).join(" ")}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

interface SegmentedMeterProps {
  /**
   * How many segments are “filled”.
   */
  filled: number;
  total?: number;
  /**
   * Variant for filled segments; neutral segments use the default track.
   */
  variant?: Exclude<MeterVariant, "info">;
  className?: string;
}

export function SegmentedMeter({
  filled,
  total = 10,
  variant = "success",
  className = "",
}: SegmentedMeterProps) {
  const safeTotal = Math.max(1, total);
  const safeFilled = Math.max(0, Math.min(safeTotal, filled));

  return (
    <div className={["meter-wrap", className || null].filter(Boolean).join(" ")}>
      <div className="meter-segmented">
        {Array.from({ length: safeTotal }).map((_, index) => {
          const isFilled = index < safeFilled;
          const segClasses = ["meter-seg"];
          if (isFilled) {
            segClasses.push("filled", variant);
          }
          return <div key={index} className={segClasses.join(" ")} />;
        })}
      </div>
    </div>
  );
}

type ProgressVariant = "info" | "success" | "warning" | "danger";

interface ProgressProps {
  value?: number;
  max?: number;
  variant?: ProgressVariant;
  indeterminate?: boolean;
  className?: string;
}

export function Progress({
  value,
  max = 100,
  variant = "info",
  indeterminate = false,
  className = "",
}: ProgressProps) {
  const hasValue = typeof value === "number" && Number.isFinite(value);
  const ratio = hasValue ? Math.max(0, Math.min(1, value / max)) : 0;
  const width = `${Math.round(ratio * 100)}%`;

  return (
    <div
      className={["progress-track", className || null].filter(Boolean).join(" ")}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={hasValue && !indeterminate ? value : undefined}
      aria-busy={indeterminate}
    >
      <div
        className={[
          "progress-bar",
          variant,
          indeterminate ? "indeterminate" : null,
        ]
          .filter(Boolean)
          .join(" ")}
        style={indeterminate ? undefined : { width }}
      />
    </div>
  );
}

