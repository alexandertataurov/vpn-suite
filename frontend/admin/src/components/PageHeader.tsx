import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { Heading, Text, RelativeTime } from "@vpn-suite/shared/ui";
import { Breadcrumb, type BreadcrumbItem } from "./Breadcrumb";

export interface PageHeaderProps {
  /** Back link (e.g. in detail views). Renders as "Back to …" */
  backTo?: string;
  backLabel?: string;
  /** Breadcrumb segments. If set, shown before or instead of title */
  breadcrumbItems?: BreadcrumbItem[];
  /** Page title (optional if breadcrumb last item is the title) */
  title?: string;
  /** Optional short description under the title */
  description?: string;
  /** Optional scope/region label (e.g. "Region: All", "Region: eu") */
  scopeLabel?: string;
  /** Optional last updated ISO date string; shown as relative time */
  lastUpdated?: string;
  /** Optional icon shown in a rounded block next to title */
  icon?: LucideIcon;
  /** Primary action (one per screen) */
  primaryAction?: ReactNode;
  /** Secondary actions (icons, dropdown). Max 2–3 visible; rest in dropdown. */
  children?: ReactNode;
}

export function PageHeader({
  backTo,
  backLabel,
  breadcrumbItems,
  title,
  description,
  scopeLabel,
  lastUpdated,
  icon: Icon,
  primaryAction,
  children,
}: PageHeaderProps) {
  const hasMeta = scopeLabel != null || lastUpdated != null;
  return (
    <header className="page-header">
      <div className="page-header-start">
        {backTo != null ? (
          <Link to={backTo} className="page-header-back">
            {backLabel ?? "Back"}
          </Link>
        ) : null}
        {breadcrumbItems != null && breadcrumbItems.length > 0 ? (
          <Breadcrumb items={breadcrumbItems} lastAsTitle={title == null} />
        ) : null}
        {(Icon != null || title != null || description != null || hasMeta) ? (
          <div className="page-header-title-block">
            {Icon != null ? (
              <div className="page-header-icon" aria-hidden>
                <Icon strokeWidth={1.5} />
              </div>
            ) : null}
            <div className="page-header-title-inner">
              {title != null ? (
                <Heading level={1} className="page-header-title">{title}</Heading>
              ) : null}
              {description != null ? (
                <Text variant="muted" as="p" className="page-header-description">{description}</Text>
              ) : null}
              {hasMeta ? (
                <p className="page-header-meta" aria-label="Scope and last updated">
                  {scopeLabel != null ? <span>{scopeLabel}</span> : null}
                  {scopeLabel != null && lastUpdated != null ? " · " : null}
                  {lastUpdated != null ? (
                    <span>Updated <RelativeTime date={lastUpdated} updateInterval={5000} title={new Date(lastUpdated).toISOString()} /></span>
                  ) : null}
                </p>
              ) : null}
            </div>
          </div>
        ) : title != null ? (
          <Heading level={1} className="page-header-title">{title}</Heading>
        ) : null}
      </div>
      <div className="page-header-actions">
        {primaryAction}
        {children}
      </div>
    </header>
  );
}
