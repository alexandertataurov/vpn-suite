import { useEffect, useMemo } from "react";
import type { ContainerMetricsTimeseries } from "@vpn-suite/shared/types";
import { ChartFrame } from "../ChartFrame";
import { EChart } from "../EChart";
import { formatDurationShort, formatPct, type TimeZoneMode } from "@vpn-suite/shared";
import { makeOpsTimeseriesOption } from "../presets/opsTimeseries";
import { computeTimeseriesStatus, normalizeContainerSeries, stepMsFromContainerMetrics } from "../timeseries";
import { getChartTheme } from "../theme";

type Props = {
  metrics?: ContainerMetricsTimeseries;
  isLoading?: boolean;
  error?: unknown;
  tz?: TimeZoneMode;
  height?: number;
  onStatus?: (s: { stale: boolean; partial: boolean; empty: boolean; lastTsMs: number | null }) => void;
  onRetry?: () => void;
};

export function CpuPctChart({ metrics, isLoading, error, tz = "utc", height = 240, onStatus, onRetry }: Props) {
  const series = useMemo(() => normalizeContainerSeries(metrics, "cpu_pct"), [metrics]);
  const stepMs = stepMsFromContainerMetrics(metrics);
  const status = useMemo(() => computeTimeseriesStatus({ points: series, stepMs }), [series, stepMs]);
  const statusMessage = useMemo(() => {
    const parts: string[] = [];
    if (status.stale && status.lastAgeMs != null) parts.push(`Latest sample ${formatDurationShort(status.lastAgeMs)} ago.`);
    if (status.partial && status.maxGapMs > 0) {
      parts.push(`Max gap ${formatDurationShort(status.maxGapMs)} (step ${formatDurationShort(stepMs)}).`);
    }
    return parts.join(" ");
  }, [status.lastAgeMs, status.maxGapMs, status.partial, status.stale, stepMs]);

  useEffect(
    () => onStatus?.({ stale: status.stale, partial: status.partial, empty: status.empty, lastTsMs: status.lastTsMs }),
    [onStatus, status.empty, status.lastTsMs, status.partial, status.stale]
  );

  const option = useMemo(() => {
    const t = getChartTheme();
    return makeOpsTimeseriesOption({
      tz,
      series: [{ name: "CPU", data: series, color: t.series.main, area: true }],
      yMin: 0,
      yMax: 100,
      yAxisFormatter: (v) => formatPct(v, { digits: 0 }),
      tooltipValue: (_name, v) => (v == null ? "—" : formatPct(v, { digits: 1 })),
      showLegend: false,
      showZoom: "auto",
    });
  }, [series, tz]);

  return (
    <ChartFrame
      height={height}
      isLoading={isLoading}
      error={error}
      empty={status.empty}
      stale={status.stale}
      partial={status.partial}
      statusMessage={statusMessage}
      ariaLabel={`CPU percent over time (${tz.toUpperCase()})`}
      onRetry={onRetry}
    >
      <EChart className="ref-echart" height={height} option={option} />
    </ChartFrame>
  );
}
