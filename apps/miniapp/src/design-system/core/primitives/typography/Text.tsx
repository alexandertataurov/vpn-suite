import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export type TextVariant = "body" | "body-sm" | "meta" | "caption";
export type TextSize = "inherit" | "sm" | "base" | "lg";

export interface TextProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  variant?: TextVariant;
  size?: TextSize;
  as?: "p" | "span" | "div" | "code";
  children?: ReactNode;
}

const variantClass: Record<TextVariant, string> = {
  body: "type-body",
  "body-sm": "type-body-sm",
  meta: "type-meta",
  caption: "type-caption",
};

export function Text({
  variant = "body",
  size,
  as: As = "p",
  className = "",
  children,
  ...props
}: TextProps) {
  return (
    <As className={cn(variantClass[variant], size && `text-${size}`, className)} {...props}>
      {children}
    </As>
  );
}
