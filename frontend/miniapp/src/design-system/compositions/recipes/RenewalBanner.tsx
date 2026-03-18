import { IconAlertTriangle, IconChevronRight, IconRotateCw } from "../../icons";
import "./RenewalBanner.css";

/** Renewal banner variant. warning/expiring = days left; danger/expired = access lost. */
export type RenewalBannerVariant = "warning" | "danger" | "expiring" | "expired";

export interface RenewalBannerProps {
  variant: RenewalBannerVariant;
  title: string;
  subtitle: string;
  badge?: string;
  onClick: () => void;
  className?: string;
}

const VARIANT_TO_CSS: Record<RenewalBannerVariant, "warning" | "danger"> = {
  warning: "warning",
  danger: "danger",
  expiring: "warning",
  expired: "danger",
};

const ICONS = {
  warning: IconAlertTriangle,
  danger: IconRotateCw,
};

export function RenewalBanner({
  variant,
  title,
  subtitle,
  badge,
  onClick,
  className,
}: RenewalBannerProps) {
  const cssVariant = VARIANT_TO_CSS[variant];
  const Icon = ICONS[cssVariant];
  const cardClass = [
    "renewal-banner",
    `renewal-banner--${cssVariant}`,
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
      data-layer="RenewalBanner"
    >
      <span className="rb-accent" aria-hidden />
      <div className="rb-icon-wrap">
        <Icon size={18} strokeWidth={2} />
      </div>
      <div className="rb-body">
        <div className="rb-title-row">
          <span className="rb-title">{title}</span>
          {badge && <span className="rb-badge">{badge}</span>}
        </div>
        <p className="rb-sub">{subtitle}</p>
      </div>
      <div className="rb-chev">
        <IconChevronRight size={13} strokeWidth={2} />
      </div>
    </div>
  );
}
