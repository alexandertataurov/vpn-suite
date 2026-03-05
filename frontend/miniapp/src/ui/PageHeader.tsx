import type { HTMLAttributes, ReactNode } from "react";
import { H1, Body } from "./Typography";

export interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children?: ReactNode;
}

/** Page head per design system (.ph). */
export function PageHeader({
  title,
  subtitle,
  action,
  className = "",
  children,
  ...props
}: PageHeaderProps) {
  return (
    <header className={`ph ${className}`.trim()} {...props}>
      <div>
        <H1 as="h1" className="ph-title tracking-trim data-truncate">{title}</H1>
        {subtitle && <div className="ph-meta"><Body as="span">{subtitle}</Body></div>}
        {children}
      </div>
      {action ? <div className="ph-actions">{action}</div> : null}
    </header>
  );
}
