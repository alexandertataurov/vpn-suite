import type { HTMLAttributes, ReactNode } from "react";

/** Profile row badge variants per amnezia-miniapp-design-guidelines.md §4.2 */
export type PillChipVariant = "beta" | "active" | "expiring" | "expired";

export interface PillChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  children: ReactNode;
  variant?: PillChipVariant;
}

/** Pill chip for profile row — Beta, PRO, Expiring, Expired. */
export function PillChip({
  children,
  variant = "beta",
  className = "",
  ...props
}: PillChipProps) {
  const showDot = variant === "active" || variant === "expiring" || variant === "expired";
  return (
    <span
      className={`pill-chip pill-chip--${variant} ${className}`.trim()}
      data-layer="PillChip"
      {...props}
    >
      {showDot ? <span className="pill-chip-dot" aria-hidden /> : null}
      {children}
    </span>
  );
}
