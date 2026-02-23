import type { SelectHTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import { Field } from "./Field";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange"> {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  id?: string;
}

export function Select({
  options,
  value,
  onChange,
  label,
  error,
  id: idProp,
  className = "",
  ...props
}: SelectProps) {
  const id = idProp ?? (typeof label === "string" ? label.toLowerCase().replace(/\s/g, "-") : undefined);
  const select = (
    <select
      id={id}
      className={cn("input", "select", error && "input-error", className)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={!!error}
      aria-describedby={error && id ? `${id}-error` : undefined}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
  if (label != null || error != null) {
    return (
      <Field id={id} label={label} error={error}>
        {select}
      </Field>
    );
  }
  return select;
}
