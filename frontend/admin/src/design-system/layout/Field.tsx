import type { ReactNode } from "react";
import { cn } from "@vpn-suite/shared";

export interface FieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactNode;
  id?: string;
  className?: string;
}

export function Field({ label, hint, description, error, required, children, id, className }: FieldProps) {
  const controlId = id ?? `field-${Math.random().toString(36).slice(2)}`;
  const resolvedHint = description ?? hint;
  return (
    <div className={cn("ds-field", className)}>
      {label != null && (
        <label htmlFor={controlId} className="ds-field__label">
          {label}
          {required && <span className="ds-field__required" aria-hidden> *</span>}
        </label>
      )}
      <div className="ds-field__control">{children}</div>
      {resolvedHint != null && !error && <p className="ds-field__hint">{resolvedHint}</p>}
      {error != null && <p className="ds-field__error">{error}</p>}
    </div>
  );
}

Field.displayName = "Field";
