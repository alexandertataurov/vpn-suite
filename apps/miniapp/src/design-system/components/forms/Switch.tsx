import type { ButtonHTMLAttributes } from "react";
import { cn } from "@vpn-suite/shared";

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/** Standalone switch control. Use ToggleRow for settings-style label + switch. */
export function Switch({
  checked,
  onCheckedChange,
  className = "",
  disabled,
  "aria-label": ariaLabel,
  ...props
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel ?? (checked ? "On" : "Off")}
      disabled={disabled}
      className={cn("ts-toggle", checked && "on", className)}
      onClick={() => {
        if (disabled) return;
        onCheckedChange(!checked);
      }}
      {...props}
    >
      <span className="ts-track" aria-hidden>
        <span className="ts-knob" />
      </span>
    </button>
  );
}
