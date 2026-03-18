import type { ButtonHTMLAttributes } from "react";
import { IconSettings } from "../../../icons";

export interface SettingsButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  onClick: () => void;
}

/** 34×34 circular settings gear button for profile row. */
export function SettingsButton({ onClick, className = "", ...props }: SettingsButtonProps) {
  return (
    <button
      type="button"
      className={`settings-button ${className}`.trim()}
      onClick={onClick}
      aria-label="Settings"
      {...props}
    >
      <IconSettings size={22} strokeWidth={1.8} />
    </button>
  );
}
