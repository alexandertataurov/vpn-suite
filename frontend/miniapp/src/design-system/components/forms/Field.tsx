import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";
import { Label } from "./Label";
import { HelperText } from "./HelperText";

/**
 * Primitive: label + slot + description + error. Use with Input, Select, or custom control.
 * Keeps form fields visually and semantically consistent. Uses typography primitives Label and HelperText.
 */
export interface FieldProps {
  id?: string;
  label?: ReactNode;
  /** Optional hint or description below the control (hidden when error is shown) */
  description?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ id, label, description, error, children, className = "" }: FieldProps) {
  return (
    <div className={cn("field", className)}>
      {label != null && (
        <Label htmlFor={id}>{label}</Label>
      )}
      {children}
      {description != null && !error && (
        <HelperText variant="hint" id={id ? `${id}-hint` : undefined}>
          {description}
        </HelperText>
      )}
      {error != null && error !== "" && (
        <HelperText variant="error" role="alert" id={id ? `${id}-error` : undefined}>
          {error}
        </HelperText>
      )}
    </div>
  );
}
