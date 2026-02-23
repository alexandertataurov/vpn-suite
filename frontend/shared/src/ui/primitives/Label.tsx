import type { LabelHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

export type PrimitiveLabelSize = "sm" | "md";

export interface PrimitiveLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  size?: PrimitiveLabelSize;
  required?: boolean;
  children: ReactNode;
}

export function Label({ size = "md", required, className = "", children, ...props }: PrimitiveLabelProps) {
  return (
    <label className={cn("ds-label", className)} data-size={size} {...props}>
      {children}
      {required ? <span aria-hidden> *</span> : null}
    </label>
  );
}
