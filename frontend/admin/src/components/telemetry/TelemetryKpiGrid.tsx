import type { ReactNode } from "react";

export interface TelemetryKpiItem {
  id: string;
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
}

export interface TelemetryKpiGridProps {
  items: TelemetryKpiItem[];
  className?: string;
}

export function TelemetryKpiGrid({ items, className }: TelemetryKpiGridProps) {
  if (!items.length) return null;

  return (
    <dl className={`telemetry-kpi-grid ${className ?? ""}`}>
      {items.map((item) => (
        <div key={item.id} className="telemetry-kpi-item">
          <dt className="telemetry-kpi-label text-muted text-sm">
            {item.label}
          </dt>
          <dd className="telemetry-kpi-value font-mono text-base">
            {item.value}
          </dd>
          {item.hint ? (
            <dd className="telemetry-kpi-hint text-xs text-muted">
              {item.hint}
            </dd>
          ) : null}
        </div>
      ))}
    </dl>
  );
}

