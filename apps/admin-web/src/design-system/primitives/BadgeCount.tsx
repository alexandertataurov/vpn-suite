import type { HTMLAttributes, ReactNode } from "react";

type Variant = "neutral" | "success" | "warning" | "danger" | "info";

interface BadgeCountProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  children: ReactNode;
}

export function BadgeCount({
  variant = "neutral",
  children,
  className = "",
  ...props
}: BadgeCountProps) {
  return (
    <span
      className={["badge-count", variant, className || null].filter(Boolean).join(" ")}
      aria-label={typeof children === "number" ? `Count: ${children}` : undefined}
      {...props}
    >
      {children}
    </span>
  );
}
