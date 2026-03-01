import type { SelectHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "@vpn-suite/shared";
import { Field } from "../layout/Field";

export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children" | "value" | "onChange"> {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: ReactNode;
  description?: ReactNode;
  error?: string;
  placeholder?: string;
  loading?: boolean;
  loadingLabel?: string;
  emptyLabel?: string;
  className?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (props, ref) => {
    const {
      options,
      value,
      onChange,
      label,
      description,
      error,
      placeholder,
      loading = false,
      loadingLabel = "Loading…",
      emptyLabel = "No options",
      className,
      id: idProp,
      ...rest
    } = props;
    const id = idProp ?? (typeof label === "string" ? label.toLowerCase().replace(/\s/g, "-") : undefined);
    const resolvedOptions: SelectOption[] = loading
      ? [{ value: "", label: loadingLabel, disabled: true }]
      : options.length
        ? options
        : [{ value: "", label: emptyLabel, disabled: true }];
    const select = (
      <select
        ref={ref}
        id={id}
        className={cn("ds-select", error && "ds-select--error", className)}
        data-error={error ?? undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error && id ? `${id}-error` : description && id ? `${id}-hint` : undefined}
        disabled={rest.disabled ?? (loading || options.length === 0)}
        {...rest}
      >
        {placeholder != null ? (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        ) : null}
        {resolvedOptions.map((o) => (
          <option key={o.value || String(o.label)} value={o.value} disabled={o.disabled}>
            {o.label}
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
);

Select.displayName = "Select";
