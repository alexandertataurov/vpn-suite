import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant =
  | "default"
  | "primary"
  | "solid"
  | "ghost"
  | "success"
  | "warning"
  | "danger"
  // Back-compat with older admin usage
  | "secondary";

type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  iconOnly?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  iconOnly = false,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const effectiveVariant = variant === "secondary" ? "default" : variant;
  return (
    <button
      type="button"
      className={[
        "btn",
        `btn-${size}`,
        `btn-${effectiveVariant}`,
        iconOnly ? "btn-icon-only" : null,
        className || null,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
