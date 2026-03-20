import type { ButtonHTMLAttributes } from "react";
import { IconSettings } from "../../../icons";
import { useI18n } from "@/hooks";

export interface SettingsButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  onClick: () => void;
}

/** 34×34 circular settings gear button for profile row. */
export function SettingsButton({ onClick, className = "", "aria-label": ariaLabel, ...props }: SettingsButtonProps) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      className={`settings-button ${className}`.trim()}
      onClick={onClick}
      aria-label={ariaLabel ?? t("common.settings_aria")}
      {...props}
    >
      <IconSettings size={22} strokeWidth={1.8} />
    </button>
  );
}
