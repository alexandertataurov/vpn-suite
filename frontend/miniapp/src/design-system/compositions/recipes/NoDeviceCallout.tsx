import type { ReactNode } from "react";
import { Button } from "../../components/Button";
import { IconMonitor } from "../../icons";

export interface NoDeviceCalloutProps {
  title: string;
  subtitle: string;
  /** Legacy: use with onCtaClick */
  ctaLabel?: string;
  /** Legacy */
  onCtaClick?: () => void;
  /** Preferred: single callback for add device */
  onAddDevice?: () => void;
  ctaIcon?: ReactNode;
  className?: string;
}

export function NoDeviceCallout({
  title,
  subtitle,
  ctaLabel = "Add device",
  onCtaClick,
  onAddDevice,
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
      <Button
        variant="ghost"
        className="no-device-callout-cta nd-cta"
        onClick={onAddDevice ?? onCtaClick ?? (() => {})}
        aria-label={ctaLabel}
        startIcon={ctaIcon}
      >
        {ctaLabel}
      </Button>
    </div>
  );
}
