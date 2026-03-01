import type { ReactNode } from "react";

export interface ChartPanelProps {
  title: string;
  liveValue?: string;
  height?: number;
  timeRange?: string;
  children: ReactNode;
}

/**
 * Aerospace chart panel: title (optional live value), optional time range subtitle, chart.
 * Panel bg: var(--bg-surface). Use with ChartFrame + EChart for charts.
 */
export function ChartPanel({
  title,
  liveValue,
  height = 280,
  timeRange,
  children,
}: ChartPanelProps) {
  const titleText = liveValue != null ? `${title} · ${liveValue}` : title;
  return (
    <div className="chart-panel" style={{ "--chart-panel-height": `${height}px` } as React.CSSProperties}>
      <span
        className="chart-panel__title"
        aria-hidden
        title={timeRange ? `${titleText} — ${timeRange}` : titleText}
      >
        {titleText}
      </span>
      {timeRange ? (
        <span className="chart-panel__subtitle" aria-hidden>
          {timeRange}
        </span>
      ) : null}
      <div className="chart-panel__content">{children}</div>
    </div>
  );
}
