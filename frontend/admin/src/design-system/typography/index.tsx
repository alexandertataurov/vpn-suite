import type { ReactNode, ElementType } from "react";
import { cn } from "@vpn-suite/shared";
export { Heading } from "./Heading";
export type { HeadingProps } from "./Heading";
export { Text } from "./Text";
export type { TextProps, TextVariant, TextSize } from "./Text";

interface TextProps {
  children: ReactNode;
  className?: string;
}

interface MetricProps extends TextProps {
  unit?: string;
}

interface TimestampProps {
  value: Date | string | number;
  className?: string;
}

export interface LabelProps extends TextProps {
  required?: boolean;
  as?: ElementType;
  htmlFor?: string;
}

export type HelperTextVariant = "hint" | "error";
export interface HelperTextProps {
  variant?: HelperTextVariant;
  className?: string;
  children?: ReactNode;
  id?: string;
  role?: "alert";
}

/** font-display, text-xs, uppercase, tracking-wider, text-muted */
export function Label({ children, className = "", required, as: Component = "label", htmlFor }: LabelProps) {
  return (
    <Component
      className={cn("ds-typo-label", "typo-label", className)}
      {...(Component === "label" && htmlFor != null ? { htmlFor } : {})}
    >
      {children}
      {required ? <span aria-hidden> *</span> : null}
    </Component>
  );
}

const helperVariantClass: Record<HelperTextVariant, string> = {
  hint: "typo-helper-hint",
  error: "typo-helper-error",
};

export function HelperText({ variant = "hint", className = "", children, ...props }: HelperTextProps) {
  return (
    <span className={cn(helperVariantClass[variant], className)} {...props}>
      {children}
    </span>
  );
}

export interface CodeTextProps extends React.HTMLAttributes<HTMLElement> {
  block?: boolean;
  className?: string;
  children?: ReactNode;
}

export function CodeText({ block = false, className = "", children, ...props }: CodeTextProps) {
  const Component = block ? "pre" : "code";
  const styleClass = block ? "typo-code-block" : "typo-code-inline";
  return (
    <Component className={cn(styleClass, className)} {...props}>
      {children}
    </Component>
  );
}

export type StatDeltaDirection = "up" | "down" | "neutral";

export interface StatProps {
  value: ReactNode;
  unit?: string;
  label: ReactNode;
  delta?: { value: string; direction: StatDeltaDirection };
  className?: string;
}

const deltaDirClass: Record<StatDeltaDirection, string> = {
  up: "typo-stat-delta-up",
  down: "typo-stat-delta-down",
  neutral: "typo-stat-delta-neutral",
};

export function Stat({ value, unit, label, delta, className = "" }: StatProps) {
  return (
    <div className={cn("typo-stat", className)}>
      <p className="typo-stat-label">{label}</p>
      <p className="typo-stat-value">
        {value}
        {unit != null ? <span> {unit}</span> : null}
      </p>
      {delta != null ? (
        <span className={cn("typo-stat-delta", deltaDirClass[delta.direction])}>{delta.value}</span>
      ) : null}
    </div>
  );
}

/** font-body, text-sm, text-primary */
export function Body({ children, className = "" }: TextProps) {
  return (
    <span
      className={cn("ds-typo-body", className)}
    >
      {children}
    </span>
  );
}

/** font-data, text-sm, tabular-nums, text-primary */
export function Data({ children, className = "" }: TextProps) {
  return (
    <span
      className={cn("ds-typo-data", className)}
    >
      {children}
    </span>
  );
}

/** font-data, text-xl, tabular-nums; unit text-muted text-base */
export function Metric({
  children,
  unit,
  className = "",
}: MetricProps) {
  return (
    <span className={cn("ds-typo-metric", className)}>
      <span className="ds-typo-metric-value">
        {children}
      </span>
      {unit != null && (
        <span className="ds-typo-metric-unit">
          {unit}
        </span>
      )}
    </span>
  );
}

/** font-display, text-2xl, uppercase, tracking-wide */
export function PageTitle({ children, className = "" }: TextProps) {
  return (
    <h1
      className={cn("ds-typo-page-title", className)}
    >
      {children}
    </h1>
  );
}

/** font-display, text-lg, uppercase, tracking-wide */
export function SectionTitle({ children, className = "" }: TextProps) {
  return (
    <h2
      className={cn("ds-typo-section-title", className)}
    >
      {children}
    </h2>
  );
}

/** font-data, text-2xs, text-muted, always UTC */
export function Timestamp({ value, className = "" }: TimestampProps) {
  const d = typeof value === "number" ? new Date(value) : new Date(value);
  const iso = d.toISOString();
  return (
    <time
      dateTime={iso}
      className={cn("ds-typo-timestamp", className)}
      title={iso}
    >
      {iso.replace("T", " ").replace(/\.\d{3}Z$/, "Z")}
    </time>
  );
}
