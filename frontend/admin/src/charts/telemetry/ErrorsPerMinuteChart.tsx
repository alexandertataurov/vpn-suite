import { useEffect, useMemo } from "react";
import type { ContainerLogLine } from "@vpn-suite/shared/types";
import { ChartFrame } from "../ChartFrame";
import { EChart } from "../EChart";
import { type TimeZoneMode, formatDurationShort } from "@vpn-suite/shared";
import { makeOpsTimeseriesOption } from "../presets/opsTimeseries";
import type { XY } from "../timeseries";
import { detectStale, pickLastTimestamp } from "../timeseries";
import { getChartTheme } from "../theme";

function floorToMinute(tsMs: number) {
  return Math.floor(tsMs / 60_000) * 60_000;
}

function bucketErrorsPerMinute(
  logs: ContainerLogLine[],
  rangeMinutes = 60
): { errors: XY[]; warns: XY[]; stepMs: number; totalErrors: number; totalWarns: number; lastLogTsMs: number | null } {
  const now = Date.now();
  const from = now - rangeMinutes * 60_000;
  const buckets = new Map<number, { e: number; w: number }>();
  let lastLogTsMs: number | null = null;
  for (const line of logs) {
    const ts = Date.parse(line.ts);
    if (!Number.isFinite(ts) || ts < from) continue;
    if (lastLogTsMs == null || ts > lastLogTsMs) lastLogTsMs = ts;
    const b = floorToMinute(ts);
    const cur = buckets.get(b) ?? { e: 0, w: 0 };
    if (line.severity === "error") cur.e += 1;
    else if (line.severity === "warn") cur.w += 1;
    buckets.set(b, cur);
  }

  const errors: XY[] = [];
  const warns: XY[] = [];
  let totalErrors = 0;
  let totalWarns = 0;

  const start = floorToMinute(from);
  const end = floorToMinute(now);
  for (let t = start; t <= end; t += 60_000) {
    const v = buckets.get(t) ?? { e: 0, w: 0 };
    totalErrors += v.e;
    totalWarns += v.w;
    errors.push([t, v.e]);
    warns.push([t, v.w]);
  }

  return { errors, warns, stepMs: 60_000, totalErrors, totalWarns, lastLogTsMs };
}

type Props = {
  logs: ContainerLogLine[];
  isLoading?: boolean;
  error?: unknown;
  tz?: TimeZoneMode;
  height?: number;
  onStatus?: (s: { stale: boolean; partial: boolean; empty: boolean; lastTsMs: number | null }) => void;
  onRetry?: () => void;
};

export function ErrorsPerMinuteChart({ logs, isLoading, error, tz = "utc", height = 200, onStatus, onRetry }: Props) {
  const { errors, warns, stepMs, totalErrors, totalWarns, lastLogTsMs } = useMemo(
    () => bucketErrorsPerMinute(logs, 60),
    [logs]
  );
  const empty = totalErrors + totalWarns === 0;
  const lastTs = useMemo(() => lastLogTsMs ?? pickLastTimestamp(errors), [errors, lastLogTsMs]);
  const stale = useMemo(() => detectStale({ lastTsMs: lastTs, stepMs }), [lastTs, stepMs]);
  const partial = false;
  const statusMessage = useMemo(() => {
    if (!stale || !lastTs) return "";
    const ageMs = Math.max(0, Date.now() - lastTs);
    return `Latest log sample ${formatDurationShort(ageMs)} ago.`;
  }, [lastTs, stale]);

  useEffect(() => onStatus?.({ stale, partial, empty, lastTsMs: lastTs }), [empty, lastTs, onStatus, partial, stale]);

  const option = useMemo(() => {
    const t = getChartTheme();
    return makeOpsTimeseriesOption({
      tz,
      series: [
        { name: "Errors", type: "bar", data: errors, color: t.series.bad, stack: "a" },
        { name: "Warnings", type: "bar", data: warns, color: t.series.warn, stack: "a" },
      ],
      yAxisFormatter: (v) => String(Math.round(v)),
      tooltipValue: (_name, v) => (v == null ? "—" : String(Math.round(v))),
      showLegend: true,
      showZoom: false,
    });
  }, [errors, tz, warns]);

  return (
    <ChartFrame
      height={height}
      isLoading={isLoading}
      error={error}
      empty={empty}
      stale={stale}
      partial={partial}
      statusMessage={statusMessage}
      emptyMessage="No warn/error log lines in the last 60 minutes."
      ariaLabel={`Errors and warnings per minute (${tz.toUpperCase()})`}
      onRetry={onRetry}
    >
      <EChart className="ref-echart" height={height} option={option} />
    </ChartFrame>
  );
}
