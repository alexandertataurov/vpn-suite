import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export interface BoxProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

/** Layout + base styling only; no business logic. Use tokens via className/design-system CSS. */
export function Box({ className = "", children, ...props }: BoxProps) {
  return (
    <div className={cn("ds-box", className)} {...props}>
      {children}
    </div>
  );
}
