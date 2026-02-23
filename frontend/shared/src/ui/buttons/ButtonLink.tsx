import { Link } from "react-router-dom";
import type { CSSProperties, ReactNode } from "react";
import { getButtonClassName, type ButtonVariant, type ButtonSize } from "./Button";

export interface ButtonLinkProps {
  to: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  kind?: "default" | "connect";
  className?: string;
  style?: CSSProperties;
  target?: string;
  rel?: string;
  children: ReactNode;
}

export function ButtonLink({
  to,
  variant = "primary",
  size = "sm",
  kind = "default",
  className = "",
  style,
  target,
  rel,
  children,
}: ButtonLinkProps) {
  const effectiveSize = kind === "connect" ? "lg" : size;
  const extra = kind === "connect" ? `connect-button ${className}`.trim() : className;
  return (
    <Link to={to} className={getButtonClassName(variant, effectiveSize, extra)} style={style} target={target} rel={rel}>
      {children}
    </Link>
  );
}
