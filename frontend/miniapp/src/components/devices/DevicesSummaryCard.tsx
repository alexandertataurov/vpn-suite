import { useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import { IconMonitor } from "@/design-system/icons";
import { HeroCard } from "@/design-system";
import { useI18n } from "@/hooks";

export interface DevicesSummaryMetric {
  keyLabel: string;
  valueLabel: string;
  percent: number;
  tone: "healthy" | "warning" | "danger" | "neutral";
  showProgress: boolean;
}

function ProgressBarFill({ percent, tone }: { percent: number; tone: DevicesSummaryMetric["tone"] }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    ref.current?.style.setProperty("--progress-width", `${percent}%`);
  }, [percent]);

  return (
    <div
      ref={ref}
      className={`modern-progress-bar-fill devices-summary-progress modern-progress-bar-fill--${tone === "healthy" ? "healthy" : tone === "warning" ? "warning" : tone === "danger" ? "danger" : "neutral"}`}
    />
  );
}

export interface DevicesSummaryCardProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  cardClassName?: string;
  metrics: DevicesSummaryMetric[];
}

export function DevicesSummaryCard({
  title,
  description,
  action,
  className = "",
  metrics,
}: DevicesSummaryCardProps) {
  const { t } = useI18n();
  return (
    <HeroCard
      variant="status"
      icon={<IconMonitor strokeWidth={2.5} size={22} />}
      eyebrow={t("devices.eyebrow_label")}
      title={title ?? "Devices"}
      subtitle={description ?? undefined}
      actions={action}
      className={className}
    >
      <div className="modern-device-grid">
        {metrics.map((metric) => (
          <div key={metric.keyLabel} className="modern-device-metric">
            <div className="modern-metric-label">{metric.keyLabel}</div>
            <div className="modern-metric-value devices-summary-metric-value">
              {metric.valueLabel}
            </div>
            {metric.showProgress ? (
              <div className="modern-progress-bar-bg">
                <ProgressBarFill percent={metric.percent} tone={metric.tone} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </HeroCard>
  );
}
