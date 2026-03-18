import type { ReactNode } from "react";
import { Button } from "../../../components/Button";

export interface CalloutBlockProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  ctaIcon?: ReactNode;
  className?: string;
  /** For analytics. Sets data-layer on root. */
  dataLayer?: string;
}

/**
 * Callout pattern: icon + title + subtitle + CTA.
 * Extracted from NoDeviceCallout.
 */
export function CalloutBlock({
  icon,
  title,
  subtitle,
  ctaLabel = "Add device",
  onCtaClick,
  ctaIcon,
  className,
  dataLayer,
}: CalloutBlockProps) {
  return (
    <div
      className={["callout-block", className].filter(Boolean).join(" ")}
      {...(dataLayer ? { "data-layer": dataLayer } : {})}
    >
      <div className="callout-block__icon">{icon}</div>
      <div className="callout-block__body">
        <span className="callout-block__title">{title}</span>
        <span className="callout-block__subtitle">{subtitle}</span>
      </div>
      <Button
        variant="ghost"
        className="callout-block__cta"
        onClick={onCtaClick ?? (() => {})}
        aria-label={ctaLabel}
        startIcon={ctaIcon}
      >
        {ctaLabel}
      </Button>
    </div>
  );
}
