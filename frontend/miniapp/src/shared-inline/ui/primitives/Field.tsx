import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Label } from "./Label";

export interface PrimitiveFieldProps {
  id?: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({ id, label, hint, error, required, children, className = "" }: PrimitiveFieldProps) {
  return (
    <div className={cn("ds-field", className)}>
      {label != null ? (
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
      ) : null}
      {children}
      {error ? (
        <span className="ds-field-error" id={id ? `${id}-error` : undefined} role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="ds-field-hint" id={id ? `${id}-hint` : undefined}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}
