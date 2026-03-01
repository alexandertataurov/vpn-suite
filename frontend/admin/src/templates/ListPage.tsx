import type { ReactNode, HTMLAttributes } from "react";
import type { LucideIcon } from "@/design-system/icons";
import { CommandBar, type BreadcrumbItem } from "@/components";
import { PageLayout } from "@/components";

export interface ListPageProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "children"> {
  title: string;
  breadcrumbItems?: BreadcrumbItem[];
  description?: string;
  icon?: LucideIcon;
  search?: ReactNode;
  primaryAction?: ReactNode;
  filterBar?: ReactNode;
  children: ReactNode;
  pagination?: ReactNode;
  className?: string;
  testId?: string;
}

/**
 * Aerospace list page template: CommandBar (title + search + New X) → FilterBar → Table → Pagination.
 */
export function ListPage({
  title,
  breadcrumbItems,
  description,
  icon,
  search,
  primaryAction,
  filterBar,
  children,
  pagination,
  className = "",
  testId,
  ...rest
}: ListPageProps) {
  const resolvedTestId =
    testId ?? (rest as { "data-testid"?: string })["data-testid"];
  return (
    <PageLayout className={className} testId={resolvedTestId}>
      <div className="list-page template-page" {...rest}>
        <CommandBar title={title} breadcrumbItems={breadcrumbItems} description={description} icon={icon} primaryAction={primaryAction}>
          {search}
        </CommandBar>
        {filterBar != null && (
          <div className="list-page__filter-bar" role="region" aria-label="Filters">
            {filterBar}
          </div>
        )}
        <div className="list-page__content">{children}</div>
        {pagination != null && <div className="list-page__pagination">{pagination}</div>}
      </div>
    </PageLayout>
  );
}
