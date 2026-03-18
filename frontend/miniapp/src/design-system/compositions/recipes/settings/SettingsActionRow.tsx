import type { ReactNode } from "react";
import { RowItem, type RowItemIconVariant } from "../../patterns";

export interface SettingsActionRowProps {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  value?: string;
  tone?: "default" | "warning" | "danger" | "blue" | "green" | "amber" | "red" | "neutral";
  danger?: boolean;
  actionIndicator?: "chevron" | "external" | "none";
  onClick?: () => void;
  className?: string;
}

function toIconVariant(tone: string, danger: boolean): RowItemIconVariant {
  if (danger || tone === "danger") return "danger";
  if (tone === "warning" || tone === "amber") return "amber";
  if (tone === "blue") return "blue";
  if (tone === "green") return "green";
  if (tone === "red") return "red";
  if (tone === "neutral" || tone === "default") return "neutral";
  return "default";
}

/**
 * Settings-style action row. Uses RowItem pattern.
 * @deprecated Prefer ListRow. Kept for Storybook/legacy.
 */
export function SettingsActionRow({
  icon,
  title,
  description,
  value,
  tone = "default",
  danger = false,
  actionIndicator = "chevron",
  onClick,
  className = "",
}: SettingsActionRowProps) {
  const iconVariant = toIconVariant(tone, danger);
  const showChevron = actionIndicator === "chevron";
  const rightContent = (
    <>
      {value}
      {actionIndicator === "external" ? (
        <span className="settings-action-external-icon" aria-hidden>
          ↗
        </span>
      ) : null}
    </>
  );

  return (
    <RowItem
      icon={icon}
      iconVariant={iconVariant}
      label={title}
      subtitle={description}
      labelClassName={danger ? "ri-label--danger" : undefined}
      right={rightContent}
      showChevron={showChevron}
      className={`modern-list-item ${className}`.trim()}
      onClick={onClick}
    />
  );
}
