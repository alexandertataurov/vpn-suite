import type { InputHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "@vpn-suite/shared";
import { Field } from "../layout/Field";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix" | "suffix"> {
  error?: boolean | string;
  label?: ReactNode;
  description?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, label, description, prefix, suffix, className, style, id: idProp, ...rest }, ref) => {
    const resolvedId =
      idProp ?? (typeof label === "string" ? label.toLowerCase().replace(/\s/g, "-") : undefined);
    const hasField = label != null || description != null || typeof error === "string";
    const input = (
      <div
        className={cn(
          "ds-input-wrap",
          !!error && "ds-input-wrap--error",
          (prefix ?? suffix) && "ds-input-wrap--has-affix"
        )}
        style={style}
      >
        {prefix ? <span className="ds-input-prefix">{prefix}</span> : null}
        <input
          ref={ref}
          id={resolvedId}
          className={cn("ds-input", className)}
          data-error={!!error || undefined}
          {...rest}
        />
        {suffix ? <span className="ds-input-suffix">{suffix}</span> : null}
      </div>
    );
    if (hasField) {
      return (
        <Field id={resolvedId} label={label} description={description} error={typeof error === "string" ? error : undefined}>
          {input}
        </Field>
      );
    }
    return input;
  }
);

Input.displayName = "Input";
