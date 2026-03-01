import type { ReactNode, HTMLAttributes } from "react";
import type { LucideIcon } from "@/design-system/icons";
import { CommandBar, PageLayout } from "@/components";

export interface DashboardPageProps extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "children"> {
  title: string;
  titleBadge?: ReactNode;
  breadcrumbItems?: { label: string; to?: string }[];
  description?: ReactNode;
  icon?: LucideIcon;
  primaryAction?: ReactNode;
  timeRangeSelector?: ReactNode;
  refreshControl?: ReactNode;
  metricTiles?: ReactNode;
  children: ReactNode;
  className?: string;
  testId?: string;
}

/**
 * Aerospace dashboard page template: CommandBar (title + time range + refresh) → MetricTiles → PanelGrid.
 */
export function DashboardPage({
  title,
  titleBadge,
  breadcrumbItems,
  description,
  icon,
  primaryAction,
  timeRangeSelector,
  refreshControl,
  metricTiles,
  children,
  className = "",
  testId,
  ...rest
}: DashboardPageProps) {
  const resolvedTestId =
    testId ?? (rest as { "data-testid"?: string })["data-testid"];
  return (
    <PageLayout className={className} testId={resolvedTestId}>
      <div className="dashboard-page template-page" {...rest}>
        <CommandBar title={title} titleBadge={titleBadge} breadcrumbItems={breadcrumbItems} description={description} icon={icon} primaryAction={primaryAction}>
          {timeRangeSelector}
          {refreshControl}
        </CommandBar>
        {metricTiles != null && (
          <div className="dashboard-page__metrics" role="region" aria-label="Key metrics">
            {metricTiles}
          </div>
        )}
        <div className="dashboard-page__content">
          {children}
        </div>
      </div>
    </PageLayout>
  );
}
