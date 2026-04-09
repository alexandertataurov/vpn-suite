import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export interface ButtonGroupProps {
  children: ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}

const alignClass = {
  left: "btn-group--left",
  center: "btn-group--center",
  right: "btn-group--right",
} as const;

export function ButtonGroup({
  children,
  align = "left",
  className = "",
}: ButtonGroupProps) {
  return (
    <div
      className={cn("btn-group", alignClass[align], className)}
      role="group"
    >
      {children}
    </div>
  );
}
