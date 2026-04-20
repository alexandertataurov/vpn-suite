import type { HTMLAttributes, KeyboardEvent, MouseEvent, ReactNode } from "react";
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
  /** Optional class for label (e.g. danger text color). */
  labelClassName?: string;
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
  labelClassName,
  right,
  showChevron = true,
  className = "",
  onClick,
  ...props
}: RowItemProps) {
  const { "aria-disabled": ariaDisabledAttr, ...restProps } = props;
  const ariaDisabled =
    ariaDisabledAttr === true || ariaDisabledAttr === "true";

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (ariaDisabled || onClick == null) return;
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      onClick(e as unknown as MouseEvent<HTMLDivElement>);
    }
  };

  const a11y =
    onClick != null
      ? {
          role: "button" as const,
          tabIndex: ariaDisabled ? -1 : 0,
          onClick: ariaDisabled ? undefined : onClick,
          onKeyDown: ariaDisabled ? undefined : handleKeyDown,
          "aria-disabled": ariaDisabled ? true : undefined,
        }
      : {};
  const isInteractive = onClick != null && !ariaDisabled;

  return (
    <div
      className={[
        "row-item",
        isInteractive ? "row-item--interactive" : "",
        ariaDisabled && onClick != null ? "row-item--disabled" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...a11y}
      {...restProps}
    >
      <div className={`ri-icon ri-icon--${iconVariant}`}>{icon}</div>
      <div className="ri-body">
        <div className={`ri-label ${labelClassName ?? ""}`.trim()}>{label}</div>
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
