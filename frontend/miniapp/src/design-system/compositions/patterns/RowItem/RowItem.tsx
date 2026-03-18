import type { HTMLAttributes, ReactNode } from "react";
import { IconChevronRight } from "@/design-system/icons";
import "./RowItem.css";

export type RowItemIconVariant =
  | "default"
  | "danger"
  | "warning"
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "neutral";

export interface RowItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  icon: ReactNode;
  iconVariant?: RowItemIconVariant;
  label: ReactNode;
  subtitle?: ReactNode;
  /** Optional class for subtitle (e.g. lr-mono for monospace). */
  subtitleClassName?: string;
  right?: ReactNode;
  /** When false, chevron is hidden (e.g. when right is a Toggle). Default true. */
  showChevron?: boolean;
}

/** Settings row: icon + label/subtitle + right slot + chevron. Single horizontal layout. */
export function RowItem({
  icon,
  iconVariant = "default",
  label,
  subtitle,
  subtitleClassName,
  right,
  showChevron = true,
  className = "",
  onClick,
  ...props
}: RowItemProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick == null) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
    }
  };

  const a11y =
    onClick != null
      ? { role: "button" as const, tabIndex: 0, onClick, onKeyDown: handleKeyDown }
      : {};

  return (
    <div className={`row-item ${className}`.trim()} {...a11y} {...props}>
      <div className={`ri-icon ri-icon--${iconVariant}`}>{icon}</div>
      <div className="ri-body">
        <div className="ri-label">{label}</div>
        {subtitle != null ? (
          <div className={`ri-sub ${subtitleClassName ?? ""}`.trim()}>{subtitle}</div>
        ) : null}
      </div>
      <div className="ri-right">
        {right}
        {showChevron ? (
          <div className="ri-chev">
            <IconChevronRight size={13} strokeWidth={2.5} aria-hidden />
          </div>
        ) : null}
      </div>
    </div>
  );
}
