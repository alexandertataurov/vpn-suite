import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "../icons";
import { Breadcrumb, type BreadcrumbItem } from "./Breadcrumb";

export interface CommandBarProps {
  /** Back link (e.g. detail views) */
  backTo?: string;
  backLabel?: string;
  /** Breadcrumb segments */
  breadcrumbItems?: BreadcrumbItem[];
  /** Page title — font-display, uppercase */
  title?: string;
  /** Optional inline badge next to title (e.g. [● HEALTHY]) */
  titleBadge?: ReactNode;
  /** Optional description under title (string or ReactNode for e.g. RelativeTime) */
  description?: ReactNode;
  /** Primary action slot */
  primaryAction?: ReactNode;
  /** Secondary actions */
  children?: ReactNode;
  /** Optional icon */
  icon?: LucideIcon;
  className?: string;
}

/**
 * Aerospace design system: page-level bar, 64px.
 * Page title, breadcrumb, primary actions. Replaces ad-hoc page headers.
 */
export function CommandBar({
  backTo,
  backLabel,
  breadcrumbItems,
  title,
  titleBadge,
  description,
  primaryAction,
  children,
  icon: Icon,
  className = "",
}: CommandBarProps) {
  return (
    <header className={`command-bar ${className}`.trim()} role="banner" data-command-bar>
      <div className="command-bar-start">
        {backTo != null ? (
          <Link to={backTo} className="command-bar-back">
            {backLabel ?? "Back"}
          </Link>
        ) : null}
        {breadcrumbItems != null && breadcrumbItems.length > 0 ? (
          <Breadcrumb items={breadcrumbItems} lastAsTitle={title == null} />
        ) : null}
        {(Icon != null || title != null || titleBadge != null || description != null) && (
          <div className="command-bar-title-block">
            {Icon != null && (
              <div className="command-bar-icon" aria-hidden>
                <Icon strokeWidth={1.5} size={20} />
              </div>
            )}
            <div className="command-bar-title-inner">
              {(title != null || titleBadge != null) && (
                <h1 className="command-bar-title font-display">
                  {title}
                  {titleBadge != null && <span className="command-bar-title-badge">{titleBadge}</span>}
                </h1>
              )}
              {description != null && (
                <p className="command-bar-description">{description}</p>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="command-bar-actions">
        {primaryAction}
        {children}
      </div>
    </header>
  );
}
