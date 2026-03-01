import type { ReactNode } from "react";
import { Heading, Text } from "@/design-system";

export interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  actions,
  className = "",
}: SectionHeaderProps) {
  return (
    <div
      className={`ref-table-section-head section-header ${className}`.trim()}
    >
      <div>
        <Heading level={4} className="section-header-title">
          {title}
        </Heading>
        {description != null && (
          <Text variant="muted" as="p" className="section-header-description">
            {description}
          </Text>
        )}
      </div>
      {actions != null ? (
        <div className="section-header-actions">{actions}</div>
      ) : null}
    </div>
  );
}
