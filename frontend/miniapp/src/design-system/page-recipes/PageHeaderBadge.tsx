import type { HTMLAttributes, ReactNode } from "react";

export type PageHeaderBadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

const BADGE_CLASS_MAP: Record<PageHeaderBadgeTone, string> = {
  neutral: "page-hd-badge--neutral",
  info: "page-hd-badge--info",
  success: "page-hd-badge--active",
  warning: "page-hd-badge--expiring",
  danger: "page-hd-badge--expired",
};

export interface PageHeaderBadgeProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  label: ReactNode;
  tone: PageHeaderBadgeTone;
  pulse?: boolean;
}

export function PageHeaderBadge({ label, tone, pulse = false, className = "", ...props }: PageHeaderBadgeProps) {
  return (
    <div className={["page-hd-badge", BADGE_CLASS_MAP[tone], className].filter(Boolean).join(" ")} {...props}>
      {pulse ? <div className="pulse pulse-dot-sm" aria-hidden /> : null}
      {label}
    </div>
  );
}
