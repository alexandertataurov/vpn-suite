import { useEffect, useMemo } from "react";
import type { ContainerMetricsTimeseries } from "@vpn-suite/shared/types";
import { ChartFrame } from "../ChartFrame";
import { EChart } from "../EChart";
import { formatBytes, formatDurationShort, type TimeZoneMode } from "@vpn-suite/shared";
import { makeOpsTimeseriesOption } from "../presets/opsTimeseries";
import {
  computeTimeseriesStatus,
  normalizeContainerSeries,
  stepMsFromContainerMetrics,
} from "../timeseries";
import { getChartTheme } from "../theme";

type Props = {
  metrics?: ContainerMetricsTimeseries;
  isLoading?: boolean;
  error?: unknown;
  tz?: TimeZoneMode;
  height?: number;
  memLimitBytes?: number | null;
  onStatus?: (s: { stale: boolean; partial: boolean; empty: boolean; lastTsMs: number | null }) => void;
  onRetry?: () => void;
};

export function MemoryBytesChart({
  metrics,
  isLoading,
  error,
  tz = "utc",
  height = 240,
  memLimitBytes,
  onStatus,
  onRetry,
}: Props) {
  const series = useMemo(() => normalizeContainerSeries(metrics, "mem_bytes"), [metrics]);
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
    const base = makeOpsTimeseriesOption({
      tz,
      series: [{ name: "Memory", data: series, color: t.series.muted, area: true }],
      yAxisFormatter: (v) => formatBytes(v, { digits: 0 }),
      tooltipValue: (_name, v) => (v == null ? "—" : formatBytes(v)),
      showLegend: false,
      showZoom: "auto",
    });

    if (memLimitBytes && Number.isFinite(memLimitBytes) && memLimitBytes > 0) {
      const nextSeries = ((base as { series?: Array<Record<string, unknown>> }).series ?? []).map((s, idx) => {
        if (idx !== 0) return s;
        return {
          ...s,
          markLine: {
            symbol: "none",
            lineStyle: { color: t.border, type: "dashed" },
            label: {
              show: true,
              formatter: `limit ${formatBytes(memLimitBytes, { digits: 0 })}`,
              color: t.muted,
              fontSize: t.axisFontSize,
            },
            data: [{ yAxis: memLimitBytes }],
          },
        };
      });

      return { ...(base as Record<string, unknown>), series: nextSeries };
    }

    return base;
  }, [memLimitBytes, series, tz]);

  return (
    <ChartFrame
      height={height}
      isLoading={isLoading}
      error={error}
      empty={status.empty}
      stale={status.stale}
      partial={status.partial}
      statusMessage={statusMessage}
      ariaLabel={`Memory bytes over time (${tz.toUpperCase()})`}
      onRetry={onRetry}
    >
      <EChart className="ref-echart" height={height} option={option} />
    </ChartFrame>
  );
}
