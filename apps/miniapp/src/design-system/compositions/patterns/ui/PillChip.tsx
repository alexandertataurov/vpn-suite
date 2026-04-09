import type { HTMLAttributes, ReactNode } from "react";

/** Profile row badge variants per amnezia-miniapp-design-guidelines.md §4.2 */
export type PillChipVariant = "beta" | "active" | "expiring" | "expired";

/** Status alias for spec compliance; maps to variant */
export type PillChipStatus = "default" | "active" | "expiring" | "expired" | "beta";

export interface PillChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Primary content; label is alias for spec compliance */
  children?: ReactNode;
  /** Alias for children */
  label?: string;
  variant?: PillChipVariant;
  /** Maps to variant: default→beta */
  status?: PillChipStatus;
  /** Override dot visibility; default derived from status */
  showDot?: boolean;
}

/** Pill chip for profile row — Beta, PRO, Expiring, Expired. */
export function PillChip({
  children,
  label: labelProp,
  variant: variantProp,
  status,
  showDot: showDotProp,
  className = "",
  ...props
}: PillChipProps) {
  const variant = variantProp ?? (status === "default" ? "beta" : status ?? "beta");
  const resolvedShowDot =
    showDotProp ?? (variant === "active" || variant === "expiring" || variant === "expired");
  const label = labelProp ?? (typeof children === "string" ? children : String(children ?? ""));
  const hasDimPart = label.includes(" · ");
  const [boldPart, dimPart] = hasDimPart ? label.split(" · ", 2) : [label, ""];
  const dimSuffix = dimPart ? ` · ${dimPart}` : "";

  return (
    <span
      className={`pill-chip pill-chip--${variant} ${className}`.trim()}
      data-layer="PillChip"
      {...props}
    >
      {resolvedShowDot ? <span className="pill-chip-dot" aria-hidden /> : null}
      {hasDimPart ? (
        <>
          <span className="pill-chip-label-bold">{boldPart}</span>
          <span className="pill-chip-label-dim">{dimSuffix}</span>
        </>
      ) : (
        label
      )}
    </span>
  );
}
