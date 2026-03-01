import type { ReactNode } from "react";
import { Stack } from "./Stack";

export interface FormStackProps {
  children: ReactNode;
  className?: string;
  "data-testid"?: string;
}

export function FormStack({ children, className, "data-testid": dataTestId }: FormStackProps) {
  return (
    <Stack direction="vertical" gap={4} className={className} data-testid={dataTestId}>
      {children}
    </Stack>
  );
}
