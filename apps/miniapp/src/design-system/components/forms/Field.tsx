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
  required?: boolean;
  /** Optional hint or description below the control (hidden when error is shown) */
  description?: ReactNode;
  error?: string;
  success?: ReactNode;
  helperPosition?: "top" | "bottom";
  children: ReactNode;
  className?: string;
}

export function Field({
  id,
  label,
  required = false,
  description,
  error,
  success,
  helperPosition = "bottom",
  children,
  className = "",
}: FieldProps) {
  const hint = description != null && !error ? (
    <HelperText variant="hint" id={id ? `${id}-hint` : undefined}>
      {description}
    </HelperText>
  ) : null;

  const successMessage = success != null && !error ? (
    <HelperText variant="success" id={id ? `${id}-success` : undefined}>
      {success}
    </HelperText>
  ) : null;

  const errorMessage = error != null && error !== "" ? (
    <HelperText variant="error" role="alert" id={id ? `${id}-error` : undefined}>
      {error}
    </HelperText>
  ) : null;

  return (
    <div className={cn("field", className)}>
      {label != null && (
        <Label htmlFor={id} required={required}>{label}</Label>
      )}
      {helperPosition === "top" ? errorMessage ?? successMessage ?? hint : null}
      {children}
      {helperPosition === "bottom" ? errorMessage ?? successMessage ?? hint : null}
    </div>
  );
}
