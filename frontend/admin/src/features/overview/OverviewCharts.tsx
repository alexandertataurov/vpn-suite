import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  type TooltipProps,
} from "recharts";
import { formatTimeAxis, formatTime } from "@/shared/utils/format";

export interface OperatorTimeseriesPoint {
  ts: number; // seconds
  peers: number;
  rx: number; // cumulative bytes
  tx: number; // cumulative bytes
}

type ChartPoint = { t: number; v: number };

function getRangeMs(points: OperatorTimeseriesPoint[]): number {
  if (points.length < 2) return 0;
  const start = points[0]!.ts * 1000;
  const end = points[points.length - 1]!.ts * 1000;
  return Math.max(0, end - start);
}

function computePeers(points: OperatorTimeseriesPoint[]): ChartPoint[] {
  return points.map((p) => ({ t: p.ts * 1000, v: p.peers }));
}

function computeThroughputBps(points: OperatorTimeseriesPoint[]): ChartPoint[] {
  if (points.length < 2) return [];
  const out: ChartPoint[] = [];
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1]!;
    const cur = points[i]!;
    const dt = cur.ts - prev.ts;
    if (dt <= 0) continue;
    const delta = (cur.rx - prev.rx) + (cur.tx - prev.tx);
    const bytes = Math.max(0, delta);
    out.push({ t: cur.ts * 1000, v: bytes / dt });
  }
  return out;
}

function latestValue(points: ChartPoint[]): number | null {
  if (points.length === 0) return null;
  const v = points[points.length - 1]!.v;
  return Number.isFinite(v) ? v : null;
}

function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: TooltipProps<number, string> & { valueFormatter: (v: number) => string }) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  const ts = typeof label === "number" ? label : Number(label);
  const labelText = Number.isFinite(ts) ? formatTime(ts, { withSeconds: false }) : String(label ?? "");
  return (
    <div className="overview-chart__tooltip">
      <div className="overview-chart__tooltip-title type-meta">{labelText}</div>
      <div className="overview-chart__tooltip-value type-data-md">{valueFormatter(v)}</div>
    </div>
  );
}

export function OverviewPeersChart(props: { points: OperatorTimeseriesPoint[]; currentPeers?: number | null }) {
  const rangeMs = getRangeMs(props.points);
  const data = useMemo(() => computePeers(props.points), [props.points]);
  const lastPeersFromSeries = latestValue(data);
  const displayPeers = props.currentPeers ?? lastPeersFromSeries;

  return (
    <div className="overview-chart">
      <div className="overview-chart__meta">
        <span className="overview-chart__kpi type-data-lg">
          {displayPeers != null ? Math.round(displayPeers).toString() : "—"}
        </span>
        <span className="overview-chart__unit type-label">connected peers</span>
      </div>
      <div className="overview-chart__plot" aria-label="Peers timeseries chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid
              stroke="var(--bd-sub)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="t"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(v) => formatTimeAxis(Number(v), { tz: "local", rangeMs })}
              tick={{
                fill: "var(--tx-mut)",
                fontSize: "var(--text-2xs)",
                fontFamily: "IBM Plex Mono, monospace",
              }}
              axisLine={{ stroke: "var(--bd-sub)" }}
              tickLine={{ stroke: "var(--bd-sub)" }}
            />
            <YAxis
              width={40}
              tick={{
                fill: "var(--tx-mut)",
                fontSize: "var(--text-2xs)",
                fontFamily: "IBM Plex Mono, monospace",
              }}
              axisLine={{ stroke: "var(--bd-sub)" }}
              tickLine={{ stroke: "var(--bd-sub)" }}
              domain={[0, "auto"]}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ stroke: "var(--tx-mut)" }}
              content={<ChartTooltip valueFormatter={(v) => `${Math.round(v)}`} />}
            />
            <Line
              type="monotone"
              dataKey="v"
              stroke="var(--chart-blue)"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
              className="cl cl-1"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function OverviewThroughputChart(props: { points: OperatorTimeseriesPoint[] }) {
  const rangeMs = getRangeMs(props.points);
  const data = useMemo(() => computeThroughputBps(props.points), [props.points]);
  const lastBps = latestValue(data);

  const formatBps = (bps: number): string => {
    if (bps >= 1e6) return `${(bps / 1e6).toFixed(1)} MB/s`;
    if (bps >= 1e3) return `${(bps / 1e3).toFixed(0)} KB/s`;
    return `${Math.round(bps)} B/s`;
  };

  return (
    <div className="overview-chart">
      <div className="overview-chart__meta">
        <span className="overview-chart__kpi type-data-lg">{lastBps != null ? formatBps(lastBps) : "—"}</span>
        <span className="overview-chart__unit type-label">bandwidth</span>
      </div>
      <div className="overview-chart__plot" aria-label="Bandwidth timeseries chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid
              stroke="var(--bd-sub)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="t"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(v) => formatTimeAxis(Number(v), { tz: "local", rangeMs })}
              tick={{
                fill: "var(--tx-mut)",
                fontSize: "var(--text-2xs)",
                fontFamily: "IBM Plex Mono, monospace",
              }}
              axisLine={{ stroke: "var(--bd-sub)" }}
              tickLine={{ stroke: "var(--bd-sub)" }}
            />
            <YAxis
              width={60}
              tick={{
                fill: "var(--tx-mut)",
                fontSize: "var(--text-2xs)",
                fontFamily: "IBM Plex Mono, monospace",
              }}
              axisLine={{ stroke: "var(--bd-sub)" }}
              tickLine={{ stroke: "var(--bd-sub)" }}
              domain={[0, "auto"]}
              tickFormatter={(v) => {
                const n = typeof v === "number" ? v : Number(v);
                return Number.isFinite(n) ? formatBps(n) : "—";
              }}
            />
            <Tooltip
              cursor={{ stroke: "var(--tx-mut)" }}
              content={<ChartTooltip valueFormatter={formatBps} />}
            />
            <Area
              type="monotone"
              dataKey="v"
              stroke="var(--chart-violet)"
              fill="var(--chart-violet)"
              fillOpacity={0.22}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
              className="cf"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

