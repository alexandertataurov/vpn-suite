import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

export interface HeadingProps extends Omit<HTMLAttributes<HTMLHeadingElement>, "children"> {
  level: 1 | 2 | 3 | 4;
  as?: ElementType;
  className?: string;
  children?: ReactNode;
}

const levelClass: Record<1 | 2 | 3 | 4, string> = {
  1: "typo-heading-1",
  2: "typo-heading-2",
  3: "typo-heading-3",
  4: "typo-heading-4",
};

const defaultTag: Record<1 | 2 | 3 | 4, "h1" | "h2" | "h3" | "h4"> = {
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
};

export function Heading({
  level,
  as,
  className = "",
  children,
  ...props
}: HeadingProps) {
  const Component = (as ?? defaultTag[level]) as ElementType;
  return (
    <Component className={cn(levelClass[level], className)} {...props}>
      {children}
    </Component>
  );
}
