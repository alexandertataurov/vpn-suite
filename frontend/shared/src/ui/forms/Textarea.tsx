import type { TextareaHTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import { Field } from "./Field";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, id: idProp, className = "", ...props }: TextareaProps) {
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
  if (label != null || error != null) {
    return (
      <Field id={id} label={label} error={error}>
        {textarea}
      </Field>
    );
  }
  return textarea;
}
