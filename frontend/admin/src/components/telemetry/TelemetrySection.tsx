import type { ReactNode } from "react";
import { Panel } from "@vpn-suite/shared/ui";

export interface TelemetrySectionProps {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  ariaLabel?: string;
  actions?: ReactNode;
  className?: string;
}

export function TelemetrySection({
  title,
  description,
  children,
  ariaLabel,
  actions,
  className,
}: TelemetrySectionProps) {
  return (
    <Panel
      as="section"
      variant="outline"
      aria-label={ariaLabel}
      className={className}
    >
      <div className="ref-section-head">
        <h3 className="ref-settings-title">{title}</h3>
        {actions ? <div className="ref-page-actions">{actions}</div> : null}
      </div>
      {description ? (
        <p className="ref-settings-text">{description}</p>
      ) : null}
      {children}
    </Panel>
  );
}

