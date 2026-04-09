import type { InputHTMLAttributes } from "react";
import { cn } from "@vpn-suite/shared";
import { Field } from "./Field";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
  success?: string;
  required?: boolean;
  helperPosition?: "top" | "bottom";
  fieldClassName?: string;
}

export function Input({
  label,
  description,
  error,
  success,
  required,
  helperPosition,
  fieldClassName,
  id: idProp,
  className = "",
  ...props
}: InputProps) {
  const id = idProp ?? (typeof label === "string" ? label.toLowerCase().replace(/\s/g, "-") : undefined);
  const input = (
    <input
      id={id}
      className={cn("input", error && "input-error", success && !error && "input-success", className)}
      aria-invalid={!!error}
      aria-describedby={error && id ? `${id}-error` : undefined}
      {...props}
    />
  );
  if (label != null || description != null || error != null || success != null) {
    return (
      <Field
        id={id}
        label={label}
        required={required}
        description={description}
        error={error}
        success={success}
        helperPosition={helperPosition}
        className={cn(
          error && "field--error",
          success && !error && "field--success",
          props.disabled && "field--disabled",
          fieldClassName,
        )}
      >
        {input}
      </Field>
    );
  }
  return input;
}
