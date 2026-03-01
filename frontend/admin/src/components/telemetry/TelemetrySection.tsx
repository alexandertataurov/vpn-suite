import type { ReactNode } from "react";
import { Card } from "@/design-system";
import { FormActions, Heading } from "@/design-system";

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
    <Card
      as="section"
      variant="outline"
      aria-label={ariaLabel}
      className={className}
    >
      <div className="ref-section-head">
        <Heading level={3} className="ref-settings-title">{title}</Heading>
        {actions ? <FormActions>{actions}</FormActions> : null}
      </div>
      {description ? (
        <p className="ref-settings-text">{description}</p>
      ) : null}
      {children}
    </Card>
  );
}
