import type { ReactNode } from "react";
import { IconMonitor } from "../../icons";

export interface NoDeviceCalloutProps {
  title: string;
  subtitle: string;
  ctaLabel: string;
  onCtaClick: () => void;
  ctaIcon?: ReactNode;
  className?: string;
}

export function NoDeviceCallout({
  title,
  subtitle,
  ctaLabel,
  onCtaClick,
  ctaIcon,
  className,
}: NoDeviceCalloutProps) {
  return (
    <div className={["no-device-callout", className].filter(Boolean).join(" ")} data-layer="NoDeviceCallout">
      <div className="no-device-callout-icon">
        <IconMonitor size={20} strokeWidth={2} />
      </div>
      <div className="no-device-callout-body">
        <span className="no-device-callout-title">{title}</span>
        <span className="no-device-callout-subtitle">{subtitle}</span>
      </div>
      <button
        type="button"
        className="no-device-callout-cta nd-cta"
        onClick={onCtaClick}
        aria-label={ctaLabel}
      >
        {ctaIcon}
        {ctaLabel}
      </button>
    </div>
  );
}
