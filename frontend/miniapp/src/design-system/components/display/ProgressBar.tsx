import { useEffect, useRef, useLayoutEffect } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export interface ProgressBarProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  value?: number;
  max?: number;
  label?: string;
  valueLabel?: ReactNode;
  valueSuffix?: ReactNode;
  layout?: "stacked" | "inline" | "split";
  size?: "primary" | "secondary" | "connection";
  loading?: boolean;
  showThresholdSuffix?: boolean;
  "data-testid"?: string;
}

export function ProgressBar({
  value = 0,
  max = 100,
  label,
  valueLabel,
  valueSuffix,
  layout = "stacked",
  size = "primary",
  loading = false,
  showThresholdSuffix = true,
  className,
  "data-testid": dataTestId,
  ...props
}: ProgressBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const hasHydratedRef = useRef(false);
  const clampedMax = Math.max(1, max);
  const pct = Math.min(clampedMax, Math.max(0, value));
  const percentage = (pct / clampedMax) * 100;
  const valueStr = `${percentage}%`;

  let threshold: "healthy" | "high" | "critical" | "limit" | "loading" = "healthy";
  if (loading) threshold = "loading";
  else if (percentage >= 100) threshold = "limit";
  else if (percentage >= 90) threshold = "critical";
  else if (percentage >= 75) threshold = "high";

  const thresholdSuffix =
    !showThresholdSuffix || loading
      ? null
      : threshold === "limit"
        ? "Limit reached"
        : threshold === "critical"
          ? "Critical"
          : threshold === "high"
            ? "High usage"
            : null;

  useLayoutEffect(() => {
    ref.current?.style.setProperty("--progress", valueStr);
  }, [valueStr]);

  useEffect(() => {
    hasHydratedRef.current = true;
  }, []);

  return (
    <div
      className={cn("progress-group", `progress-group-${layout}`, className)}
      data-testid={dataTestId}
      {...props}
    >
      {(label || valueLabel || valueSuffix || thresholdSuffix) ? (
        <div className="progress-meta">
          {label ? <div className="progress-label">{label}</div> : <span />}
          {(layout === "inline" || layout === "split") && (valueLabel || valueSuffix || thresholdSuffix) ? (
            <div className="progress-value">
              {valueLabel ? <span className="progress-value-number">{valueLabel}</span> : null}
              {valueSuffix ? <span className="progress-value-label"> {valueSuffix}</span> : null}
              {thresholdSuffix ? <span className={`progress-threshold progress-threshold-${threshold}`}> · {thresholdSuffix}</span> : null}
            </div>
          ) : null}
        </div>
      ) : null}
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={loading ? undefined : value}
        aria-valuemin={0}
        aria-valuemax={clampedMax}
        aria-label={label}
        aria-busy={loading}
        className={cn(
          "progress-bar",
          `progress-bar-${size}`,
          `progress-bar-${threshold}`,
          hasHydratedRef.current && "progress-bar-animated",
          loading && "progress-bar-indeterminate"
        )}
      >
        <div className="progress-bar-fill" />
      </div>
      {layout === "stacked" && (valueLabel || valueSuffix || thresholdSuffix) ? (
        <div className="progress-value">
          {valueLabel ? <span className="progress-value-number">{valueLabel}</span> : null}
          {valueSuffix ? <span className="progress-value-label"> {valueSuffix}</span> : null}
          {thresholdSuffix ? <span className={`progress-threshold progress-threshold-${threshold}`}> · {thresholdSuffix}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
