import type { InputHTMLAttributes } from "react";
import { cn } from "@vpn-suite/shared";
import { Field } from "./Field";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, id: idProp, className = "", ...props }: InputProps) {
  const id = idProp ?? (typeof label === "string" ? label.toLowerCase().replace(/\s/g, "-") : undefined);
  const input = (
    <input
      id={id}
      className={cn("input", error && "input-error", className)}
      aria-invalid={!!error}
      aria-describedby={error && id ? `${id}-error` : undefined}
      {...props}
    />
  );
  if (label != null || error != null) {
    return (
      <Field id={id} label={label} error={error}>
        {input}
      </Field>
    );
  }
  return input;
}
