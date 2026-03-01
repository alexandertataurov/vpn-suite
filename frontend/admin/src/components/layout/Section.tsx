import type { ReactNode } from "react";
import { Heading } from "@/design-system";

interface SectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

export function Section({ title, description, children, className = "", ariaLabel }: SectionProps) {
  return (
    <section className={`ref-page-section ${className}`.trim()} aria-label={ariaLabel}>
      {title ? <Heading level={2} className="ref-page-section-title">{title}</Heading> : null}
      {description ? <p className="ref-page-section-description">{description}</p> : null}
      {children}
    </section>
  );
}
