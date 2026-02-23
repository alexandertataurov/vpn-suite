import { useEffect, useMemo } from "react";
import type { ContainerMetricsTimeseries } from "@vpn-suite/shared/types";
import { ChartFrame } from "../ChartFrame";
import { EChart } from "../EChart";
import { formatDurationShort, formatRate, type TimeZoneMode } from "@vpn-suite/shared";
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
  onStatus?: (s: { stale: boolean; partial: boolean; empty: boolean; lastTsMs: number | null }) => void;
  onRetry?: () => void;
};

export function DiskRateChart({ metrics, isLoading, error, tz = "utc", height = 240, onStatus, onRetry }: Props) {
  const read = useMemo(() => normalizeContainerSeries(metrics, "blk_read_bps"), [metrics]);
  const write = useMemo(() => normalizeContainerSeries(metrics, "blk_write_bps"), [metrics]);
  const stepMs = stepMsFromContainerMetrics(metrics);
  const statusPoints = useMemo(() => (read.length ? read : write), [read, write]);
  const status = useMemo(() => computeTimeseriesStatus({ points: statusPoints, stepMs }), [statusPoints, stepMs]);
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
      series: [
        { name: "Read", data: read, color: t.series.muted, area: true },
        { name: "Write", data: write, color: t.series.faint, area: false },
      ],
      yAxisFormatter: (v) => formatRate(v),
      tooltipValue: (_name, v) => (v == null ? "—" : formatRate(v)),
      showLegend: true,
      showZoom: "auto",
    });
  }, [read, tz, write]);

  return (
    <ChartFrame
      height={height}
      isLoading={isLoading}
      error={error}
      empty={status.empty}
      stale={status.stale}
      partial={status.partial}
      statusMessage={statusMessage}
      ariaLabel={`Disk read/write bytes per second over time (${tz.toUpperCase()})`}
      onRetry={onRetry}
    >
      <EChart className="ref-echart" height={height} option={option} />
    </ChartFrame>
  );
}
