import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

export interface CodeTextProps extends React.HTMLAttributes<HTMLElement> {
  block?: boolean;
  className?: string;
  children?: ReactNode;
}

export function CodeText({
  block = false,
  className = "",
  children,
  ...props
}: CodeTextProps) {
  const Component = block ? "pre" : "code";
  const styleClass = block ? "typo-code-block" : "typo-code-inline";
  return (
    <Component className={cn(styleClass, className)} {...props}>
      {children}
    </Component>
  );
}
