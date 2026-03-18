import type { InputHTMLAttributes } from "react";
import { cn } from "@vpn-suite/shared";
import { Field } from "./Field";
import { Label } from "./Label";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> {
  label: string;
  description?: string;
  error?: string;
  success?: string;
  required?: boolean;
  helperPosition?: "top" | "bottom";
  fieldClassName?: string;
}

/** Checkbox form control with label, description, and validation states. */
export function Checkbox({
  label,
  description,
  error,
  success,
  required,
  helperPosition,
  fieldClassName,
  id: idProp,
  className = "",
  checked,
  ...props
}: CheckboxProps) {
  const id =
    idProp ?? label.toLowerCase().replace(/\s/g, "-").replace(/[^a-z0-9-]/g, "");

  const input = (
    <div className="checkbox-wrap">
      <span className="checkbox-control">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          className={cn("checkbox", error && "checkbox--error", success && !error && "checkbox--success", className)}
          aria-invalid={!!error}
          aria-describedby={error && id ? `${id}-error` : undefined}
          {...props}
        />
        <span className="checkbox-box" aria-hidden>
          <span className="checkbox-check" />
        </span>
      </span>
      <Label htmlFor={id} required={required} className="checkbox-label">
        {label}
      </Label>
    </div>
  );

  return (
    <Field
      id={id}
      required={required}
      description={description}
      error={error}
      success={success}
      helperPosition={helperPosition}
      className={cn(
        "field--checkbox",
        error && "field--error",
        success && !error && "field--success",
        props.disabled && "field--disabled",
        fieldClassName
      )}
    >
      {input}
    </Field>
  );
}
