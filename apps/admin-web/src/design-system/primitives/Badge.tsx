import type { HTMLAttributes, ReactNode } from "react";

type Variant = "neutral" | "success" | "warning" | "danger" | "info" | "accent";
type Size = "sm" | "md" | "lg";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  size?: Size;
  pulse?: boolean;
  children: ReactNode;
}

export function Badge({
  variant = "neutral",
  size = "md",
  pulse = false,
  children,
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={["badge", `badge-${size}`, `badge-${variant}`, className || null].filter(Boolean).join(" ")}
      {...props}
    >
      {pulse && <span className="dot pulse" aria-hidden />}
      {children}
    </span>
  );
}
