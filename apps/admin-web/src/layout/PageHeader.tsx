import type { ReactNode } from "react";
import { SectionTitle, MetaText } from "@/design-system/typography";

export interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/** Renders the design-system .ph block (page head): title, optional meta, actions. */
export function PageHeader({ title, description, actions, className = "" }: PageHeaderProps) {
  return (
    <header className={`ph ${className}`.trim()} data-testid="page-header">
      <div>
        <SectionTitle as="div" className="ph-title">
          {title}
        </SectionTitle>
        {description != null && (
          <MetaText as="div" className="ph-meta">
            {description}
          </MetaText>
        )}
      </div>
      {actions != null ? <div className="ph-actions">{actions}</div> : null}
    </header>
  );
}
