import "./ProgressBar.css";
import { useEffect, useRef, useState } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "@vpn-suite/shared";

export type ProgressBarThreshold = "healthy" | "high" | "full" | "empty";
export type ProgressBarAnnotationVariant = "warning" | "error" | "success" | "muted";
export type ProgressBarSize = "primary" | "secondary" | "connection";
export type ProgressBarLayout = "stacked" | "inline" | "split";

export interface ProgressBarProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  value: number;
  max?: number;
  unit?: string;
  label?: string;
  annotation?: string;
  annotationVariant?: ProgressBarAnnotationVariant;
  size?: ProgressBarSize;
  layout?: ProgressBarLayout;
  threshold?: ProgressBarThreshold;
  indeterminate?: boolean;
  animate?: boolean;
  showValue?: boolean;
  "data-testid"?: string;
}

function deriveThreshold(value: number, max: number): ProgressBarThreshold {
  if (value === 0) return "empty";
  const pct = max > 0 ? (value / max) * 100 : 0;
  if (pct >= 90) return "full";
  if (pct >= 70) return "high";
  return "healthy";
}

export function ProgressBar({
  value,
  max = 100,
  unit = "%",
  label,
  annotation,
  annotationVariant,
  size = "primary",
  layout = "stacked",
  threshold: thresholdProp,
  indeterminate = false,
  animate = true,
  showValue = true,
  className,
  "data-testid": dataTestId,
  ...props
}: ProgressBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const clampedMax = Math.max(1, max);
  const clampedValue = Math.min(clampedMax, Math.max(0, value));
  const percentage = (clampedValue / clampedMax) * 100;

  const threshold =
    thresholdProp ?? (indeterminate ? undefined : deriveThreshold(clampedValue, clampedMax));
  const fillVariant =
    indeterminate ? "default" : threshold ?? "default";

  useEffect(() => {
    const id = requestAnimationFrame(() => setHasMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const displayValue = indeterminate ? null : clampedValue;

  const valueBlock =
    showValue && displayValue != null ? (
      <span className="pb-value-block">
        <span className="pb-value">{displayValue}</span>
        {unit ? <span className="pb-unit">{unit}</span> : null}
        {annotation ? (
          <span
            className={cn(
              "pb-annotation",
              annotationVariant && `pb-annotation--${annotationVariant}`
            )}
          >
            {annotation}
          </span>
        ) : null}
      </span>
    ) : null;

  const trackEl = (
    <div
      ref={trackRef}
      className={cn(
        "pb-track",
        `pb-track--${size}`,
        indeterminate && "pb-track--indeterminate"
      )}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : clampedValue}
      aria-valuemin={0}
      aria-valuemax={clampedMax}
      aria-label={label}
      aria-busy={indeterminate}
    >
      <div
        className={cn(
          "pb-fill",
          `pb-fill--${fillVariant}`,
          indeterminate && "pb-fill--indeterminate"
        )}
        style={
          !indeterminate && !hasMounted
            ? { width: animate ? "0%" : `${percentage}%` }
            : indeterminate
              ? undefined
              : { width: `${percentage}%` }
        }
      />
    </div>
  );

  if (layout === "stacked") {
    return (
      <div
        className={cn(
          "pb-wrap",
          "pb-wrap--stacked",
          `pb-wrap--${size}`,
          animate && hasMounted && !indeterminate && "pb-wrap--animated",
          className
        )}
        data-testid={dataTestId}
        {...props}
      >
        {label ? (
          <div className="pb-label-row">
            <span className="pb-label">{label}</span>
          </div>
        ) : null}
        <div className="pb-track-wrap">{trackEl}</div>
        {valueBlock ? <div className="pb-value-row">{valueBlock}</div> : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "pb-wrap",
        `pb-wrap--${layout}`,
        `pb-wrap--${size}`,
        animate && hasMounted && !indeterminate && "pb-wrap--animated",
        className
      )}
      data-testid={dataTestId}
      {...props}
    >
      <div className="pb-row">
        {label ? <span className="pb-label">{label}</span> : null}
        {trackEl}
        {valueBlock ? <div className="pb-value-slot">{valueBlock}</div> : null}
      </div>
    </div>
  );
}
