import type { HTMLAttributes, ReactNode } from "react";
import { H2, Body } from "./Typography";

export interface SectionHeaderRowProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export function SectionHeaderRow({
  title,
  description,
  action,
  className = "",
  ...props
}: SectionHeaderRowProps) {
  if (!title && !description && !action) return null;

  return (
    <div className={`miniapp-section-header-row ${className}`.trim()} {...props}>
      <div className="miniapp-section-header-copy">
        {title ? <H2 as="h2" className="tracking-trim">{title}</H2> : null}
        {description ? <Body className="miniapp-section-description">{description}</Body> : null}
      </div>
      {action ? <div className="miniapp-section-header-action">{action}</div> : null}
    </div>
  );
}

export interface PageSectionProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}

export function PageSection({
  title,
  description,
  action,
  className = "",
  children,
  ...props
}: PageSectionProps) {
  return (
    <section className={`miniapp-page-section ${className}`.trim()} {...props}>
      <SectionHeaderRow title={title} description={description} action={action} />
      {children}
    </section>
  );
}
