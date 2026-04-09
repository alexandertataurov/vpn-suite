import type { TextareaHTMLAttributes } from "react";
import { cn } from "@vpn-suite/shared";
import { Field } from "./Field";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  error?: string;
  success?: string;
  required?: boolean;
  helperPosition?: "top" | "bottom";
}

export function Textarea({
  label,
  description,
  error,
  success,
  required,
  helperPosition,
  id: idProp,
  className = "",
  ...props
}: TextareaProps) {
  const id = idProp ?? (typeof label === "string" ? label.toLowerCase().replace(/\s/g, "-") : undefined);
  const textarea = (
    <textarea
      id={id}
      className={cn("input", "textarea", error && "input-error", className)}
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
      >
        {textarea}
      </Field>
    );
  }
  return textarea;
}
