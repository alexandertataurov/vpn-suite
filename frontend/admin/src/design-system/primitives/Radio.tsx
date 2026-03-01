import type { InputHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "@vpn-suite/shared";

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
  className?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, className, id, ...rest }, ref) => {
    const idResolved = id ?? `radio-${Math.random().toString(36).slice(2)}`;
    return (
      <label htmlFor={idResolved} className={cn("ds-radio-wrap", className)}>
        <input ref={ref} type="radio" id={idResolved} className="ds-radio" {...rest} />
        {label != null && <span className="ds-radio-label">{label}</span>}
      </label>
    );
  }
);

Radio.displayName = "Radio";

export interface RadioGroupProps {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  options: { value: string; label: ReactNode; disabled?: boolean }[];
  className?: string;
}

export function RadioGroup({ name, value, onChange, options, className }: RadioGroupProps) {
  return (
    <div className={cn("ds-radio-group", className)} role="radiogroup">
      {options.map((o) => (
        <Radio
          key={o.value}
          name={name}
          value={o.value}
          label={o.label}
          checked={value === o.value}
          disabled={o.disabled}
          onChange={() => onChange?.(o.value)}
        />
      ))}
    </div>
  );
}

RadioGroup.displayName = "RadioGroup";
