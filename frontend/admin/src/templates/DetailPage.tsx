import type { ReactNode } from "react";
import type { LucideIcon } from "@/design-system/icons";
import { CommandBar, type BreadcrumbItem, PageLayout } from "@/components";
import { PanelGrid } from "@/design-system";

export interface DetailPageProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: string;
  breadcrumbItems?: BreadcrumbItem[];
  backTo?: string;
  backLabel?: string;
  description?: string;
  icon?: LucideIcon;
  primaryAction?: ReactNode;
  children?: ReactNode;
  metricTiles?: ReactNode;
  timeline?: ReactNode;
  panelGrid?: ReactNode;
  className?: string;
  testId?: string;
}

/**
 * Aerospace detail page template: CommandBar → MetricTile row → PanelGrid → Timeline.
 */
export function DetailPage({
  title,
  breadcrumbItems,
  backTo,
  backLabel,
  description,
  icon,
  primaryAction,
  children,
  metricTiles,
  timeline,
  panelGrid,
  className = "",
  testId,
  ...rest
}: DetailPageProps) {
  const resolvedTestId =
    testId ?? (rest as { "data-testid"?: string })["data-testid"];
  return (
    <PageLayout className={className} testId={resolvedTestId}>
      <div className="detail-page template-page" {...rest}>
        <CommandBar
          title={title}
          breadcrumbItems={breadcrumbItems}
          backTo={backTo}
          backLabel={backLabel}
          description={description}
          icon={icon}
          primaryAction={primaryAction}
        />
        {metricTiles != null && (
          <div className="detail-page__metrics" role="region" aria-label="Key metrics">
            {metricTiles}
          </div>
        )}
        {panelGrid != null && (
          <PanelGrid cols={2} className="detail-page__panels">
            {panelGrid}
          </PanelGrid>
        )}
        {children}
        {timeline != null && (
          <div className="detail-page__timeline" role="region" aria-label="Activity">
            {timeline}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
