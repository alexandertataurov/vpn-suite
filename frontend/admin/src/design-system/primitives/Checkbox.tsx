import { forwardRef, useEffect } from "react";
import { cn } from "@vpn-suite/shared";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  indeterminate?: boolean;
  label?: React.ReactNode;
}

const CheckMark = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 6l3 3 5-6" strokeLinecap="square" />
  </svg>
);

const IndeterminateMark = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="2" y1="6" x2="10" y2="6" strokeLinecap="square" />
  </svg>
);

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ indeterminate, label, className, id, ...rest }, ref) => {
    const inputId = id ?? `ds-cb-${Math.random().toString(36).slice(2)}`;

    useEffect(() => {
      if (typeof ref === "object" && ref?.current) {
        ref.current.indeterminate = !!indeterminate;
      }
    }, [indeterminate, ref]);

    return (
      <label htmlFor={inputId} className={cn("ds-checkbox-wrap", className)}>
        <span className="ds-checkbox">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className="ds-checkbox__input"
            data-indeterminate={indeterminate ?? undefined}
            {...rest}
          />
          <span className="ds-checkbox__box" aria-hidden>
            {indeterminate ? <IndeterminateMark /> : <CheckMark />}
          </span>
        </span>
        {label != null ? <span className="ds-checkbox__label">{label}</span> : null}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
