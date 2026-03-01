import { useId, type InputHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export function Checkbox({ label, id, className = "", ...props }: CheckboxProps) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;

  return (
    <label htmlFor={checkboxId} className="checkbox-wrap">
      <input
        id={checkboxId}
        type="checkbox"
        className={cn("checkbox-input", className)}
        {...props}
      />
      <span className="checkbox-label">{label}</span>
    </label>
  );
}
