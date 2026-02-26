import type { SelectHTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import { Field } from "./Field";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange"> {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  description?: string;
  error?: string;
  id?: string;
  placeholder?: string;
  loading?: boolean;
  loadingLabel?: string;
  emptyLabel?: string;
}

export function Select({
  options,
  value,
  onChange,
  label,
  description,
  error,
  id: idProp,
  placeholder,
  loading = false,
  loadingLabel = "Loading…",
  emptyLabel = "No options",
  className = "",
  ...props
}: SelectProps) {
  const id = idProp ?? (typeof label === "string" ? label.toLowerCase().replace(/\s/g, "-") : undefined);

  const resolvedOptions: SelectOption[] = loading
    ? [{ value: "", label: loadingLabel, disabled: true }]
    : options.length
      ? options
      : [{ value: "", label: emptyLabel, disabled: true }];

  const select = (
    <select
      id={id}
      className={cn("input", "select", error && "input-error", className)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={!!error}
      aria-describedby={error && id ? `${id}-error` : undefined}
      disabled={props.disabled ?? (loading || options.length === 0)}
      {...props}
    >
      {placeholder != null ? (
        <option value="" disabled hidden>
          {placeholder}
        </option>
      ) : null}
      {resolvedOptions.map((opt) => (
        <option key={opt.value || opt.label} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </option>
      ))}
    </select>
  );
  if (label != null || description != null || error != null) {
    return (
      <Field id={id} label={label} description={description} error={error}>
        {select}
      </Field>
    );
  }
  return select;
}
