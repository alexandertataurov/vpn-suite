import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

export type TextVariant = "body" | "muted" | "caption" | "code" | "danger";
export type TextSize = "sm" | "base" | "lg";

export interface TextProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  variant?: TextVariant;
  size?: TextSize;
  as?: ElementType;
  className?: string;
  children?: ReactNode;
}

const variantClass: Record<TextVariant, string> = {
  body: "typo-text-body",
  muted: "typo-text-muted",
  caption: "typo-text-caption",
  code: "typo-text-code",
  danger: "typo-text-danger",
};

const sizeOverrides: Record<TextSize, string> = {
  sm: "typo-text-body-sm",
  base: "typo-text-body",
  lg: "typo-text-body-lg",
};

export function Text({
  variant = "body",
  size,
  as: Component = "span",
  className = "",
  children,
  ...props
}: TextProps) {
  const base = variant === "body" && size ? sizeOverrides[size] : variantClass[variant];
  return (
    <Component className={cn(base, className)} {...props}>
      {children}
    </Component>
  );
}
