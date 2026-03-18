import type { HTMLAttributes, ReactNode } from "react";
import "./ToneBadge.css";

export type ToneBadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

const BADGE_CLASS_MAP: Record<ToneBadgeTone, string> = {
  neutral: "tone-badge--neutral",
  info: "tone-badge--info",
  success: "tone-badge--success",
  warning: "tone-badge--warning",
  danger: "tone-badge--danger",
};

export interface ToneBadgeProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: ReactNode;
  tone: ToneBadgeTone;
  pulse?: boolean;
}

/**
 * Badge with tone: neutral, info, success, warning, danger.
 * Extracted from PageHeaderBadge.
 */
export function ToneBadge({ label, tone, pulse = false, className = "", ...props }: ToneBadgeProps) {
  return (
    <div className={["tone-badge", BADGE_CLASS_MAP[tone], className].filter(Boolean).join(" ")} {...props}>
      {pulse ? <div className="pulse pulse-dot-sm" aria-hidden /> : null}
      {label}
    </div>
  );
}
