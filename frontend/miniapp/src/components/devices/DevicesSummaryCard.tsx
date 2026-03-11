import type { ReactNode } from "react";
import { DataCell, DataGrid, MissionProgressBar, PageCardSection } from "@/design-system";

export interface DevicesSummaryMetric {
  keyLabel: string;
  valueLabel: string;
  percent: number;
  tone: "healthy" | "warning" | "danger" | "neutral";
  showProgress: boolean;
}

export interface DevicesSummaryCardProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  cardClassName?: string;
  metrics: DevicesSummaryMetric[];
}

function metricValueTone(tone: DevicesSummaryMetric["tone"]): "green" | "amber" | "red" | "mut" {
  if (tone === "healthy") return "green";
  if (tone === "warning") return "amber";
  if (tone === "danger") return "red";
  return "mut";
}

function progressTone(tone: DevicesSummaryMetric["tone"]): "healthy" | "warning" | "danger" {
  if (tone === "healthy") return "healthy";
  if (tone === "warning") return "warning";
  return "danger";
}

export function DevicesSummaryCard({
  title,
  description,
  action,
  className = "",
  cardClassName = "module-card devices-summary-card",
  metrics,
}: DevicesSummaryCardProps) {
  return (
    <PageCardSection
      title={title}
      description={description}
      action={action}
      className={className}
      cardClassName={cardClassName}
    >
      <DataGrid columns={2}>
        {metrics.map((metric) => (
          <DataCell
            key={metric.keyLabel}
            label={metric.keyLabel}
            value={
              metric.showProgress ? (
                <div className="metric-strip">
                  <span>{metric.valueLabel}</span>
                  <MissionProgressBar
                    percent={metric.percent}
                    tone={progressTone(metric.tone)}
                    staticFill={false}
                    ariaLabel={`${metric.keyLabel} ${metric.valueLabel}`}
                  />
                </div>
              ) : (
                metric.valueLabel
              )
            }
            valueTone={metricValueTone(metric.tone)}
          />
        ))}
      </DataGrid>
    </PageCardSection>
  );
}
