import type { InputHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export type PrimitiveInputSize = "sm" | "md";

export interface PrimitiveInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: PrimitiveInputSize;
  invalid?: boolean;
}

export function Input({ size = "md", invalid, className = "", ...props }: PrimitiveInputProps) {
  return (
    <input
      className={cn("ds-input", className)}
      data-size={size}
      aria-invalid={invalid ?? undefined}
      {...props}
    />
  );
}
