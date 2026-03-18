import type { ReactNode } from "react";
import { IconChevronRight } from "@/design-system/icons";
import "./ActionBanner.css";

export type ActionBannerTone = "warning" | "danger";

export interface ActionBannerProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
  onClick: () => void;
  tone?: ActionBannerTone;
  className?: string;
}

/**
 * Clickable banner pattern: icon, title, subtitle, badge, chevron.
 * Extracted from RenewalBanner.
 */
export function ActionBanner({
  icon,
  title,
  subtitle,
  badge,
  onClick,
  tone = "warning",
  className,
}: ActionBannerProps) {
  const cardClass = [
    "action-banner",
    `action-banner--${tone}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cardClass}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      aria-label={title}
    >
      <span className="action-banner__accent" aria-hidden />
      <div className="action-banner__icon-wrap">{icon}</div>
      <div className="action-banner__body">
        <div className="action-banner__title-row">
          <span className="action-banner__title">{title}</span>
          {badge ? <span className="action-banner__badge">{badge}</span> : null}
        </div>
        <p className="action-banner__sub">{subtitle}</p>
      </div>
      <div className="action-banner__chev">
        <IconChevronRight size={13} strokeWidth={2} />
      </div>
    </div>
  );
}
