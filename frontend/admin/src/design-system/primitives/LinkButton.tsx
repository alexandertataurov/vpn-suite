import type { ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";

type Size = "sm" | "md" | "lg";
type Variant = "default" | "primary" | "ghost";

interface LinkButtonProps extends Omit<LinkProps, "className"> {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function LinkButton({
  variant = "default",
  size = "md",
  className = "",
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={["btn", `btn-${size}`, `btn-${variant}`, className || null].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </Link>
  );
}
