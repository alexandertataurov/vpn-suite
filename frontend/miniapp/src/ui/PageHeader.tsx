import type { HTMLAttributes, ReactNode } from "react";
import { H1, Body } from "./Typography";

export interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children?: ReactNode;
}

/** Page header. Uses tokens only. */
export function PageHeader({
  title,
  subtitle,
  action,
  className = "",
  children,
  ...props
}: PageHeaderProps) {
  return (
    <div className={`miniapp-page-header ${className}`.trim()} {...props}>
      <div className="miniapp-page-header-copy">
        <H1 as="h1" className="tracking-trim data-truncate">{title}</H1>
        {subtitle && <Body className="miniapp-page-subtitle">{subtitle}</Body>}
        {children}
      </div>
      {action}
    </div>
  );
}
