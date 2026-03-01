import { forwardRef } from "react";
import { cn } from "@vpn-suite/shared";

export interface ToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  onCheckedChange?: (v: boolean) => void;
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ checked, onCheckedChange, onClick, className, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      className={cn("ds-toggle", checked && "ds-toggle--on", className)}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) onCheckedChange?.(!checked);
      }}
      {...rest}
    >
      <span className="ds-toggle__thumb" />
    </button>
  )
);

Toggle.displayName = "Toggle";
