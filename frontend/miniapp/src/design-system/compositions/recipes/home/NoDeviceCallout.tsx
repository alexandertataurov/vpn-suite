import type { ReactNode } from "react";
import { IconMonitor, IconPlus } from "@/design-system/icons";
import "./NoDeviceCallout.css";

export interface NoDeviceCalloutProps {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  onAddDevice?: () => void;
  ctaIcon?: ReactNode;
  className?: string;
}

export function NoDeviceCallout({
  title = "No devices added",
  subtitle = "Add a device to generate your configuration.",
  ctaLabel = "Add device",
  onCtaClick,
  onAddDevice,
  ctaIcon,
  className,
}: NoDeviceCalloutProps) {
  const handleAddDevice = onAddDevice ?? onCtaClick;
  const isInteractive = typeof handleAddDevice === "function";

  return (
    <div className={["nd-callout", className].filter(Boolean).join(" ")} data-layer="NoDeviceCallout">
      <div className="nd-icon-wrap" aria-hidden>
        <IconMonitor size={20} strokeWidth={1.75} />
      </div>
      <div className="nd-body">
        <h2 className="nd-title">{title}</h2>
        <div className="nd-sub">{subtitle}</div>
      </div>
      <button
        type="button"
        className="nd-cta"
        onClick={handleAddDevice}
        disabled={!isInteractive}
      >
        {ctaIcon ?? <IconPlus size={14} strokeWidth={2.5} aria-hidden />}
        <span>{ctaLabel}</span>
      </button>
    </div>
  );
}
