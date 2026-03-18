import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@vpn-suite/shared";
import { Button } from "../../components/Button";
import { IconChevronRight } from "../../icons";

export interface SettingsActionRowProps {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  value?: string;
  tone?: "default" | "warning" | "danger" | "blue" | "green" | "amber" | "red" | "neutral";
  danger?: boolean;
  actionIndicator?: "chevron" | "external" | "none";
  onClick?: () => void;
  buttonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  className?: string;
}

function resolveModernTone(tone: string, danger: boolean): string {
  if (danger || tone === "danger") return "modern-icon-tone--danger";
  if (tone === "warning" || tone === "amber") return "modern-icon-tone--amber";
  if (tone === "blue") return "modern-icon-tone--blue";
  if (tone === "green") return "modern-icon-tone--green";
  if (tone === "red") return "modern-icon-tone--red";
  if (tone === "neutral" || tone === "default") return "modern-icon-tone--neutral";
  return tone;
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
  const modernToneClass = resolveModernTone(tone, danger);
  
  const content = (
    <>
      <div className={`modern-list-item-icon ${modernToneClass}`} aria-hidden>
        {icon}
      </div>
      <div className="modern-list-item-content">
        <div className={`modern-list-item-title ${danger ? "settings-action-title--danger" : ""}`}>
          {title}
        </div>
        {description != null ? <div className="modern-list-item-subtitle">{description}</div> : null}
      </div>
      {value ? <div className="modern-list-item-right settings-action-value">{value}</div> : null}
      {actionIndicator !== "none" ? (
        <div className="modern-list-item-right" aria-hidden>
          {actionIndicator === "external" ? (
             <span className="settings-action-external-icon">↗</span>
          ) : (
             <IconChevronRight size={13} strokeWidth={2.5} className="settings-action-chevron" />
          )}
        </div>
      ) : null}
    </>
  );

  const classes = `modern-list-item row-item ${className}`.trim();

  if (onClick) {
    const { className: buttonClassName, ...restButtonProps } = buttonProps ?? {};
    return (
      <Button
        {...restButtonProps}
        type="button"
        variant="ghost"
        fullWidth
        className={cn(classes, buttonClassName)}
        onClick={onClick}
      >
        {content}
      </Button>
    );
  }

  return (
    <div className={classes}>
      {content}
    </div>
  );
}
