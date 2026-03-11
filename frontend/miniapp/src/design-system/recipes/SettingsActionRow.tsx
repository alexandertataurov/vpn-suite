import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface SettingsActionRowProps {
  icon: ReactNode;
  title: string;
  description: string;
  value?: string;
  tone?: "default" | "warning" | "danger";
  danger?: boolean;
  actionIndicator?: "chevron" | "external";
  onClick: () => void;
  buttonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  className?: string;
}

export function SettingsActionRow({
  icon,
  title,
  description,
  value,
  tone = "default",
  danger = false,
  actionIndicator = "chevron",
  onClick,
  buttonProps,
  className = "",
}: SettingsActionRowProps) {
  const resolvedTone = danger ? "danger" : tone;
  return (
    <button
      type="button"
      className={`settings-list-row ${resolvedTone !== "default" ? `settings-list-row--${resolvedTone}` : ""} ${className}`.trim()}
      onClick={onClick}
      {...buttonProps}
    >
      <span className="settings-list-row__icon" aria-hidden>
        {icon}
      </span>
      <span className="settings-list-row__body">
        <span className="settings-list-row__title">{title}</span>
        <span className="settings-list-row__description">{description}</span>
      </span>
      {value ? <span className="settings-list-row__value">{value}</span> : null}
      <span className="settings-list-row__action" aria-hidden>{actionIndicator === "external" ? "↗" : ">"}</span>
    </button>
  );
}
