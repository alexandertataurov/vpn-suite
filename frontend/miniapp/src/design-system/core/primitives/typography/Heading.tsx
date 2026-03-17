import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export type HeadingLevel = 1 | 2 | 3 | 4;

export interface HeadingProps extends Omit<HTMLAttributes<HTMLHeadingElement>, "children"> {
  level?: HeadingLevel;
  as?: "h1" | "h2" | "h3" | "h4";
  children?: ReactNode;
}

const levelClass: Record<HeadingLevel, string> = {
  1: "type-h1",
  2: "type-h2",
  3: "type-h3",
  4: "type-h4",
};

export function Heading({
  level = 1,
  as: As = `h${level}` as "h1" | "h2" | "h3" | "h4",
  className = "",
  children,
  ...props
}: HeadingProps) {
  return (
    <As className={cn(levelClass[level], className)} {...props}>
      {children}
    </As>
  );
}
