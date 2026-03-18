import type { ReactNode } from "react";
import { IconAlertTriangle, IconChevronRight, IconRotateCw } from "../../icons";

/** Renewal banner variant per amnezia spec §4.4 */
export type RenewalBannerVariant = "expiring" | "expired";

export interface RenewalBannerProps {
  variant: RenewalBannerVariant;
  title: string;
  subtitle: string;
  onClick: () => void;
  icon?: ReactNode;
  className?: string;
}

const DEFAULT_ICONS: Record<RenewalBannerVariant, ReactNode> = {
  expiring: <IconAlertTriangle size={18} strokeWidth={2} />,
  expired: <IconRotateCw size={18} strokeWidth={2} />,
};

export function RenewalBanner({
  variant,
  title,
  subtitle,
  onClick,
  icon,
  className,
}: RenewalBannerProps) {
  const cardClass = [
    "renewal-banner",
    `renewal-banner--${variant}`,
    className,
  ].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      className={cardClass}
      onClick={onClick}
      aria-label={title}
      data-layer="RenewalBanner"
    >
      <div className="renewal-banner-icon">{icon ?? DEFAULT_ICONS[variant]}</div>
      <div className="renewal-banner-body">
        <span className="renewal-banner-title">{title}</span>
        <span className="renewal-banner-subtitle">{subtitle}</span>
      </div>
      <IconChevronRight size={13} strokeWidth={2} className="renewal-banner-chevron" />
    </button>
  );
}
