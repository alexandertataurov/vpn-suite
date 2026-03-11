import type { HTMLAttributes, ReactNode } from "react";
import { H1, Body } from "../components/typography";

export interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  /** Rendered on the same row as the title (e.g. notification bell). */
  trailingAction?: ReactNode;
  children?: ReactNode;
}

/** Page head — content library .page-hd + legacy .ph. */
export function PageHeader({
  title,
  subtitle,
  action,
  trailingAction,
  className = "",
  children,
  ...props
}: PageHeaderProps) {
  return (
    <header className={`page-hd ph global-page-header ${className}`.trim()} {...props}>
      <div className="global-page-heading">
        <H1 as="h1" className="page-title ph-title global-page-title tracking-trim data-truncate">
          {title}
        </H1>
        {subtitle && (
          <div className="ph-meta global-page-subtitle">
            <Body as="span">{subtitle}</Body>
          </div>
        )}
        {children}
        {action ? <div className="ph-actions global-page-actions">{action}</div> : null}
      </div>
      {trailingAction ? <div className="ph-trailing global-page-trailing">{trailingAction}</div> : null}
    </header>
  );
}
