import type { InputHTMLAttributes } from "react";
import { useId } from "react";
import { cn } from "../../utils/cn";

export interface PrimitiveCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  indeterminate?: boolean;
}

export function PrimitiveCheckbox({ label, indeterminate, id, className = "", ...props }: PrimitiveCheckboxProps) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;

  return (
    <label htmlFor={checkboxId} className={cn("ds-checkbox", className)}>
      <input
        id={checkboxId}
        type="checkbox"
        className="ds-checkbox-input"
        ref={(node) => {
          if (node) node.indeterminate = Boolean(indeterminate);
        }}
        {...props}
      />
      <span className="ds-checkbox-label">{label}</span>
    </label>
  );
}
