import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { Heading, Text } from "@vpn-suite/shared/ui";
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
  icon: Icon,
  primaryAction,
  children,
}: PageHeaderProps) {
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
        {Icon != null || description != null ? (
          <div className="page-header-title-block">
            {Icon != null ? (
              <div className="page-header-icon" aria-hidden>
                <Icon strokeWidth={1.5} />
              </div>
            ) : null}
            <div>
              {title != null ? (
                <Heading level={1} className="page-header-title">{title}</Heading>
              ) : null}
              {description != null ? (
                <Text variant="muted" as="p" className="page-header-description">{description}</Text>
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
