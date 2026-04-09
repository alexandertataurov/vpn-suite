import type { ReactNode } from "react";
import { PageHeader } from "./PageHeader";

export interface PageLayoutProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  /** Optional page-specific class (e.g. "overview-page") for CSS. */
  pageClass?: string;
  /** Optional test id for the page container. */
  dataTestId?: string;
  /** Optional. Omit for placeholder pages that only show header. */
  children?: ReactNode;
  /** If true, no PageHeader is rendered (e.g. for loading/error that use custom header). */
  hideHeader?: boolean;
}

/**
 * Standard page wrapper for dashboard pages. Renders .page container, optional page head,
 * and children. Every dashboard page should use this as the root.
 */
export function PageLayout({
  title,
  description,
  actions,
  pageClass = "",
  dataTestId,
  children,
  hideHeader = false,
}: PageLayoutProps) {
  const pageClassName = ["page", pageClass].filter(Boolean).join(" ");
  return (
    <div className={pageClassName} data-testid={dataTestId}>
      {!hideHeader && (
        <PageHeader title={title} description={description} actions={actions} />
      )}
      {children}
    </div>
  );
}
