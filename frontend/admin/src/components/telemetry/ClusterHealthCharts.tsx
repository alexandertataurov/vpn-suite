import { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { Button, RelativeTime } from "@vpn-suite/shared/ui";
import { EChart } from "../../charts/EChart";
import { ChartFrame } from "../../charts/ChartFrame";
import { makeOpsSparklineOption } from "../../charts/presets/opsSparkline";
import { getChartColors } from "../../charts/chartConfig";
import { getChartTheme } from "../../charts/theme";
import { FreshnessBadge } from "../operator/FreshnessBadge";
import type { DashboardTimeseriesPoint } from "@vpn-suite/shared/types";
import type { XY } from "../../charts/timeseries";

function freshnessFromAgeMs(ageMs: number): "fresh" | "degraded" | "stale" {
  const ageMin = ageMs / 60_000;
  if (ageMin > 5) return "stale";
  if (ageMin > 2) return "degraded";
  return "fresh";
}

interface ClusterHealthChartsProps {
  points: DashboardTimeseriesPoint[];
  timeRange?: string;
  onRefresh?: () => void;
  onTimeRangeChange?: (v: string) => void;
  className?: string;
}

export function ClusterHealthCharts({
  points,
  timeRange = "1h",
  onRefresh,
  onTimeRangeChange,
  className = "",
}: ClusterHealthChartsProps) {
  const bandwidthDownload = useMemo<XY[]>(
    () => points.map((p) => [p.ts * 1000, p.rx] as XY),
    [points]
  );
  const bandwidthUpload = useMemo<XY[]>(
    () => points.map((p) => [p.ts * 1000, p.tx] as XY),
    [points]
  );
  const connections = useMemo<XY[]>(
    () => points.map((p) => [p.ts * 1000, p.peers] as XY),
    [points]
  );
  const tz = "utc" as const;

  const bandwidthOption = useMemo(() => {
    const colors = getChartColors();
    const theme = getChartTheme();
    return makeOpsSparklineOption({
      tz,
      series: [
        { name: "Download", data: bandwidthDownload, color: colors.primary.solid, area: true, areaColor: colors.primary.area },
        { name: "Upload", data: bandwidthUpload, color: theme.series.muted, area: false },
      ],
      tooltipValue: (_name, v) => (v == null ? "—" : String(Math.round(v))),
    });
  }, [bandwidthDownload, bandwidthUpload]);

  const connectionsOption = useMemo(() => {
    const colors = getChartColors();
    return makeOpsSparklineOption({
      tz,
      series: [
        { name: "Connections", data: connections, color: colors.primary.solid, area: true, areaColor: colors.primary.area },
      ],
      tooltipValue: (_name, v) => (v == null ? "—" : String(Math.round(v))),
    });
  }, [connections]);

  const lastPoint = points.length > 0 ? points[points.length - 1] : undefined;
  const lastTs = lastPoint != null ? lastPoint.ts * 1000 : null;
  const freshness = lastTs ? freshnessFromAgeMs(Date.now() - lastTs) : "stale";

  return (
    <div className={`cluster-health-charts ${className}`}>
      <div className="cluster-health-charts-toolbar">
        {onTimeRangeChange && (
          <select
            value={timeRange}
            onChange={(e) => onTimeRangeChange(e.target.value)}
            className="cluster-health-charts-select"
            aria-label="Time range"
          >
            <option value="5m">5m</option>
            <option value="15m">15m</option>
            <option value="1h">1h</option>
            <option value="6h">6h</option>
            <option value="24h">24h</option>
          </select>
        )}
        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={onRefresh} aria-label="Refresh">
            <RefreshCw size={14} strokeWidth={2} aria-hidden /> Refresh
          </Button>
        )}
      </div>
      <div className="cluster-health-charts-grid">
        <div className="cluster-health-chart-wrap">
          {points.length > 0 ? (
            <>
              <ChartFrame height={180} ariaLabel="Cluster throughput rx/tx">
                <EChart className="ref-echart" option={bandwidthOption} />
              </ChartFrame>
              {lastTs && (
                <div className="cluster-health-chart-meta">
                  Last:{" "}
                  <FreshnessBadge freshness={freshness}>
                    <RelativeTime date={new Date(lastTs)} />
                  </FreshnessBadge>
                </div>
              )}
            </>
          ) : (
            <div className="cluster-health-chart-placeholder" aria-hidden>
              No telemetry data
            </div>
          )}
        </div>
        <div className="cluster-health-chart-wrap">
          {points.length > 0 ? (
            <>
              <ChartFrame height={180} ariaLabel="Active connections">
                <EChart className="ref-echart" option={connectionsOption} />
              </ChartFrame>
              {lastTs && (
                <div className="cluster-health-chart-meta">
                  Last:{" "}
                  <FreshnessBadge freshness={freshness}>
                    <RelativeTime date={new Date(lastTs)} />
                  </FreshnessBadge>
                </div>
              )}
            </>
          ) : (
            <div className="cluster-health-chart-placeholder" aria-hidden>
              No telemetry data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
