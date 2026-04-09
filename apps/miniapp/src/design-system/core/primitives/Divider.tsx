import type { HTMLAttributes } from "react";
import { cn } from "@vpn-suite/shared";

export type PrimitiveDividerOrientation = "horizontal" | "vertical";
export type PrimitiveDividerTone = "subtle" | "default";

export interface PrimitiveDividerProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: PrimitiveDividerOrientation;
  tone?: PrimitiveDividerTone;
}

export function Divider({ orientation = "horizontal", tone = "subtle", className = "", ...props }: PrimitiveDividerProps) {
  return (
    <div
      className={cn("ds-divider", className)}
      data-orientation={orientation}
      data-tone={tone}
      role="separator"
      aria-orientation={orientation}
      {...props}
    />
  );
}
