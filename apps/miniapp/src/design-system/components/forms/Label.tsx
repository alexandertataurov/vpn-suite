import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export type LabelState = "idle" | "focused" | "error" | "success" | "disabled";

export interface LabelProps extends Omit<ComponentPropsWithoutRef<"label">, "children"> {
  required?: boolean;
  as?: ElementType;
  htmlFor?: string;
  className?: string;
  children?: ReactNode;
  state?: LabelState;
}

export function Label({
  required,
  as: Component = "label",
  htmlFor,
  className = "",
  children,
  state = "idle",
  ...props
}: LabelProps) {
  return (
    <Component
      className={cn("typo-label", state !== "idle" && `typo-label--${state}`, className)}
      data-label-state={state}
      {...(Component === "label" && htmlFor != null ? { htmlFor } : {})}
      {...props}
    >
      {children}
      {required ? <span className="typo-label-required" aria-hidden> *</span> : null}
    </Component>
  );
}
