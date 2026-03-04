import type { SelectHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export type PrimitiveSelectSize = "sm" | "md";

export interface PrimitiveSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface PrimitiveSelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "size"> {
  size?: PrimitiveSelectSize;
  invalid?: boolean;
  options: PrimitiveSelectOption[];
  value: string;
  onChange: (value: string) => void;
}

export function PrimitiveSelect({ size = "md", invalid, options, value, onChange, className = "", ...props }: PrimitiveSelectProps) {
  return (
    <select
      className={cn("ds-select", className)}
      data-size={size}
      aria-invalid={invalid ?? undefined}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      {...props}
    >
      {options.map((opt) => ( // key=
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
