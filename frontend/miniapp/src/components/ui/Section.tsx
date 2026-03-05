import type { HTMLAttributes, ReactNode } from "react";
import { BodyText, SectionTitle } from "./Typography";

export interface SectionProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}

export function Section({
  title,
  description,
  action,
  children,
  className = "",
  ...props
}: SectionProps) {
  return (
    <section className={`ds-section ${className}`.trim()} {...props}>
      {(title ?? description ?? action) ? (
        <div className="ds-card-header">
          <div className="min-w-0">
            {title ? <SectionTitle as="h2">{title}</SectionTitle> : null}
            {description ? <BodyText as="p">{description}</BodyText> : null}
          </div>
          {action ? <div>{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
