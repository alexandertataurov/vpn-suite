import type { ReactNode } from "react";
import { Stack as PrimitiveStack } from "../primitives/Stack";

export interface FormStackProps {
  children: ReactNode;
  className?: string;
  "data-testid"?: string;
}

/**
 * Layout primitive for form layouts: flex column with spacing-md gap.
 * Use instead of raw form-stack class.
 */
export function FormStack({
  children,
  className,
  "data-testid": dataTestId,
}: FormStackProps) {
  return (
    <PrimitiveStack
      direction="vertical"
      gap="4"
      className={className}
      data-testid={dataTestId}
    >
      {children}
    </PrimitiveStack>
  );
}
