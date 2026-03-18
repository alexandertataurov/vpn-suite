import { useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import { IconMonitor } from "@/design-system/icons";

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
  return (
    <div className={`modern-hero-card ${className}`}>
      <div className={action ? "modern-status-group devices-summary-header--has-action" : "modern-status-group devices-summary-header"}>
        <div className="modern-pulse-indicator">
           <IconMonitor strokeWidth={2.5} size={22} />
        </div>
        <div className="modern-status-text u-flex-1">
          <div className="modern-header-label">DEVICE MANAGEMENT</div>
          <div className="modern-status-title">{title ?? "Devices"}</div>
          {description && <div className="modern-status-subtitle">{description}</div>}
        </div>
        {action && (
          <div className="devices-summary-card__header-action">
            {action}
          </div>
        )}
      </div>

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
    </div>
  );
}
