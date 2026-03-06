import type { HTMLAttributes, ReactNode } from "react";
import { H1, Body } from "../components/Typography";

export interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children?: ReactNode;
}

function splitHeaderTitle(title: string): { lead: string; accent: string | null } {
  const normalized = title.trim();
  const ampIndex = normalized.indexOf("&");
  if (ampIndex <= 0 || ampIndex >= normalized.length - 1) {
    return { lead: normalized, accent: null };
  }
  const lead = normalized.slice(0, ampIndex).trimEnd();
  const right = normalized.slice(ampIndex + 1).trimStart();
  if (!lead || !right) {
    return { lead: normalized, accent: null };
  }
  return { lead, accent: `& ${right}` };
}

/** Page head — content library .page-hd + legacy .ph. */
export function PageHeader({
  title,
  subtitle,
  action,
  className = "",
  children,
  ...props
}: PageHeaderProps) {
  const { lead, accent } = splitHeaderTitle(title);

  return (
    <header className={`page-hd ph global-page-header ${className}`.trim()} {...props}>
      <div className="global-page-heading">
        <H1 as="h1" className="page-title ph-title global-page-title tracking-trim data-truncate">
          {lead}
          {accent ? <span className="global-page-title-accent"> {accent}</span> : null}
        </H1>
        {subtitle && (
          <div className="ph-meta global-page-subtitle">
            <Body as="span">{subtitle}</Body>
          </div>
        )}
        {children}
      </div>
      {action ? <div className="ph-actions global-page-actions">{action}</div> : null}
    </header>
  );
}
