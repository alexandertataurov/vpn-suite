import { Link } from "react-router-dom";
import type { CSSProperties, ReactNode } from "react";
import { Button, type ButtonVariant, type ButtonSize } from "./Button";

export interface ButtonLinkProps {
  to: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  kind?: "default" | "connect";
  className?: string;
  style?: CSSProperties;
  target?: string;
  rel?: string;
  onClick?: () => void;
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
  onClick,
  children,
}: ButtonLinkProps) {
  const effectiveSize = kind === "connect" ? "lg" : size;
  return (
    <Button asChild variant={variant} size={effectiveSize} className={className}>
      <Link to={to} style={style} target={target} rel={rel} onClick={onClick}>
        {children}
      </Link>
    </Button>
  );
}
