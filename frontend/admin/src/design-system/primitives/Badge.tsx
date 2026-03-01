import type { ReactNode, HTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@vpn-suite/shared";

export type BadgeVariant =
  | "nominal"
  | "warning"
  | "critical"
  | "standby"
  | "accent"
  | "default"
  | "success"
  | "danger"
  | "neutral"
  | "info";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  variant?: BadgeVariant;
  pulse?: boolean;
  size?: BadgeSize;
  asChild?: boolean;
  children: ReactNode;
  className?: string;
}

export function Badge({
  variant = "default",
  pulse = false,
  size = "md",
  asChild = false,
  children,
  className,
  ...rest
}: BadgeProps) {
  const Comp = asChild ? Slot : "span";
  const resolvedVariant = (() => {
    if (variant === "success") return "nominal";
    if (variant === "danger") return "critical";
    if (variant === "neutral") return "standby";
    if (variant === "info") return "accent";
    return variant;
  })();
  return (
    <Comp
      className={cn(
        "ds-badge",
        `ds-badge--${resolvedVariant}`,
        `ds-badge--${size}`,
        pulse && "ds-badge--pulse",
        className
      )}
      data-variant={resolvedVariant}
      data-size={size}
      {...rest}
    >
      {pulse ? <span className="ds-badge__dot" aria-hidden /> : null}
      {children}
    </Comp>
  );
}
