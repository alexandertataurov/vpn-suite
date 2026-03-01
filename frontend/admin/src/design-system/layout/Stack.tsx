import type { ReactNode, HTMLAttributes } from "react";
import { cn } from "@vpn-suite/shared";

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  direction?: "vertical" | "horizontal";
  gap?: 1 | 2 | 3 | 4 | 6 | 8 | string | number;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between";
  wrap?: boolean;
  children: ReactNode;
}

const GAP = { 1: "var(--space-1)", 2: "var(--space-2)", 3: "var(--space-3)", 4: "var(--space-4)", 6: "var(--space-6)", 8: "var(--space-8)" };

function resolveGap(gap: StackProps["gap"]): string | undefined {
  if (gap == null) return undefined;
  const value = typeof gap === "string" ? (gap.match(/^\d+$/) ? Number(gap) : undefined) : gap;
  if (value && value in GAP) return GAP[value as keyof typeof GAP];
  if (typeof gap === "number") return `${gap}px`;
  return undefined;
}

export function Stack({ direction = "vertical", gap = 2, align = "start", justify = "start", wrap = false, children, className, ...rest }: StackProps) {
  const alignItems = align === "start" ? "flex-start" : align === "end" ? "flex-end" : align;
  const justifyContent = justify === "start" ? "flex-start" : justify === "end" ? "flex-end" : justify === "between" ? "space-between" : justify;
  return (
    <div
      className={cn("ds-stack", className)}
      style={{
        display: "flex",
        flexDirection: direction === "vertical" ? "column" : "row",
        gap: resolveGap(gap),
        alignItems,
        justifyContent,
        flexWrap: wrap ? "wrap" : "nowrap",
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

Stack.displayName = "Stack";
