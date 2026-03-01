import type { ReactNode } from "react";
import { Stack as PrimitiveStack } from "../primitives/Stack";

export interface InlineProps {
  gap?: number | string;
  wrap?: boolean;
  align?: "start" | "center" | "end" | "stretch";
  className?: string;
  children: ReactNode;
  "data-testid"?: string;
}

export function Inline({
  gap,
  wrap = false,
  align = "center",
  className,
  children,
  "data-testid": dataTestId,
}: InlineProps) {
  const resolvedGap =
    typeof gap === "number" ? String(gap) : typeof gap === "string" && /^\d+$/.test(gap) ? gap : undefined;
  if (gap != null && resolvedGap == null && process.env.NODE_ENV !== "production") {
    console.warn("[Inline] Only token spacing keys are supported. Use PrimitiveStack for custom gaps.");
  }
  return (
    <PrimitiveStack
      direction="horizontal"
      gap={resolvedGap}
      align={align}
      wrap={wrap}
      className={className}
      data-testid={dataTestId}
    >
      {children}
    </PrimitiveStack>
  );
}
