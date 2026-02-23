import type { ContainerMetricsTimeseries } from "@vpn-suite/shared/types";

export type XY = [number, number | null];

export function toMs(ts: string | number): number {
  if (typeof ts === "number") {
    // Heuristic: seconds vs ms.
    return ts < 1e12 ? ts * 1000 : ts;
  }
  const parsed = Date.parse(ts);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function pickLastTimestamp(points: XY[]): number | null {
  for (let i = points.length - 1; i >= 0; i -= 1) {
    const p = points[i];
    if (!p) continue;
    const [ts, v] = p;
    if (ts > 0 && v != null) return ts;
  }
  return null;
}

export function isSeriesEffectivelyEmpty(points: XY[]): boolean {
  for (const p of points) {
    if (!p) continue;
    const v = p[1];
    if (v != null) return false;
  }
  return true;
}

export function normalizeContainerSeries(
  metrics: ContainerMetricsTimeseries | undefined,
  key: keyof ContainerMetricsTimeseries["points"][number]
): XY[] {
  const pts = metrics?.points ?? [];
  const out: XY[] = [];
  for (const p of pts) {
    const tsMs = toMs(p.ts);
    const raw = (p as unknown as Record<string, unknown>)[String(key)];
    const v = typeof raw === "number" && Number.isFinite(raw) ? raw : null;
    if (!tsMs) continue;
    // ECharts can be fragile when a series is "present" but every value is null.
    // For telemetry we treat nulls as missing samples and drop them from the plotted series.
    if (v == null) continue;
    out.push([tsMs, v]);
  }
  out.sort((a, b) => a[0] - b[0]);
  return out;
}

/** Align with telemetry-freshness FRESH threshold (30s) */
const STALE_AGE_MS = 30_000;

export function detectStale(args: {
  lastTsMs: number | null;
  stepMs: number;
  nowMs?: number;
}): boolean {
  if (!args.lastTsMs) return false;
  const now = args.nowMs ?? Date.now();
  return now - args.lastTsMs > Math.max(args.stepMs * 2, STALE_AGE_MS);
}

export function detectPartial(args: {
  points: XY[];
  stepMs: number;
}): { partial: boolean; maxGapMs: number } {
  const { points, stepMs } = args;
  if (points.length < 2) return { partial: false, maxGapMs: 0 };

  let maxGap = 0;
  for (let i = 1; i < points.length; i += 1) {
    const cur = points[i];
    const prev = points[i - 1];
    if (!cur || !prev) continue;
    const gap = cur[0] - prev[0];
    if (gap > maxGap) maxGap = gap;
  }

  return { partial: maxGap > stepMs * 2.2, maxGapMs: maxGap };
}

export function stepMsFromContainerMetrics(metrics?: ContainerMetricsTimeseries): number {
  const stepSeconds = metrics?.step_seconds ?? 0;
  return stepSeconds > 0 ? stepSeconds * 1000 : 15_000;
}

export function computeTimeseriesStatus(args: {
  points: XY[];
  stepMs: number;
  nowMs?: number;
}): { empty: boolean; stale: boolean; partial: boolean; lastTsMs: number | null; maxGapMs: number; lastAgeMs: number | null } {
  const lastTsMs = pickLastTimestamp(args.points);
  const now = args.nowMs ?? Date.now();
  const empty = args.points.length === 0 || isSeriesEffectivelyEmpty(args.points);
  const stale = !empty && detectStale({ lastTsMs, stepMs: args.stepMs, nowMs: now });
  const partialInfo = !empty ? detectPartial({ points: args.points, stepMs: args.stepMs }) : { partial: false, maxGapMs: 0 };
  const lastAgeMs = lastTsMs ? Math.max(0, now - lastTsMs) : null;
  return {
    empty,
    stale,
    partial: partialInfo.partial,
    lastTsMs,
    maxGapMs: partialInfo.maxGapMs,
    lastAgeMs,
  };
}
