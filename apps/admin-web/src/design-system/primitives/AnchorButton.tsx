import type { AnchorHTMLAttributes, ReactNode } from "react";

type Size = "sm" | "md" | "lg";
type Variant = "default" | "primary" | "ghost";

interface AnchorButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function AnchorButton({
  variant = "default",
  size = "md",
  className = "",
  children,
  ...props
}: AnchorButtonProps) {
  return (
    <a
      className={["btn", `btn-${size}`, `btn-${variant}`, className || null].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </a>
  );
}
