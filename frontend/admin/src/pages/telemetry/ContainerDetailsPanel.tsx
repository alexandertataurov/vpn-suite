import { useMemo, useState } from "react";
import type { ContainerLogLine, ContainerMetricsTimeseries, ContainerSummary } from "@vpn-suite/shared/types";
import { TimeSeriesPanel } from "../../components/TimeSeriesPanel";
import { CpuPctChart } from "../../charts/telemetry/CpuPctChart";
import { DiskRateChart } from "../../charts/telemetry/DiskRateChart";
import { ErrorsPerMinuteChart } from "../../charts/telemetry/ErrorsPerMinuteChart";
import { MemoryBytesChart } from "../../charts/telemetry/MemoryBytesChart";
import { NetRateChart } from "../../charts/telemetry/NetRateChart";
import { Panel, Button } from "@vpn-suite/shared/ui";
import { formatBytes, formatTime } from "@vpn-suite/shared";

function formatUptime(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

interface Props {
  container: ContainerSummary | null;
  metrics: ContainerMetricsTimeseries | undefined;
  metricsError?: unknown;
  isLoading: boolean;
  canReadLogs: boolean;
  logs: ContainerLogLine[];
  logsLoading?: boolean;
  logsError?: unknown;
  onMetricsRetry?: () => void;
  onLogsRetry?: () => void;
  onStart?: () => void;
  onStop?: () => void;
  onRestart?: () => void;
  startPending?: boolean;
  stopPending?: boolean;
  restartPending?: boolean;
}

function statusFrom(args: {
  isLoading?: boolean;
  error?: unknown;
  empty?: boolean;
  stale?: boolean;
  partial?: boolean;
}): "loading" | "error" | "empty" | "stale" | "partial" | "live" {
  if (args.isLoading) return "loading";
  if (args.error) return "error";
  if (args.empty) return "empty";
  if (args.stale) return "stale";
  if (args.partial) return "partial";
  return "live";
}

export function ContainerDetailsPanel({
  container,
  metrics,
  metricsError,
  isLoading,
  canReadLogs,
  logs,
  logsLoading,
  logsError,
  onMetricsRetry,
  onLogsRetry,
  onStart,
  onStop,
  onRestart,
  startPending,
  stopPending,
  restartPending,
}: Props) {
  const [cpuState, setCpuState] = useState({ stale: false, partial: false, empty: true, lastTsMs: null as number | null });
  const [memState, setMemState] = useState({ stale: false, partial: false, empty: true, lastTsMs: null as number | null });
  const [netState, setNetState] = useState({ stale: false, partial: false, empty: true, lastTsMs: null as number | null });
  const [diskState, setDiskState] = useState({ stale: false, partial: false, empty: true, lastTsMs: null as number | null });
  const [errState, setErrState] = useState({ stale: false, partial: false, empty: true, lastTsMs: null as number | null });

  const tz = "utc" as const;
  const lastUpdated = useMemo(() => {
    const ms = cpuState.lastTsMs ?? memState.lastTsMs ?? netState.lastTsMs ?? diskState.lastTsMs;
    return ms
      ? `Updated ${formatTime(ms, { tz, withSeconds: true })}`
      : "No samples yet";
  }, [cpuState.lastTsMs, diskState.lastTsMs, memState.lastTsMs, netState.lastTsMs, tz]);

  if (container == null) {
    return (
      <Panel as="section" variant="outline" aria-label="Container details">
        <div className="ref-section-head">
          <h3 className="ref-settings-title">Container details</h3>
        </div>
        <p className="text-muted">Select a container to inspect metrics and logs.</p>
      </Panel>
    );
  }

  return (
    <>
      <Panel as="section" variant="outline" aria-label="Container details">
        <div className="ref-section-head">
          <h3 className="ref-settings-title">Container details</h3>
          <div className="ref-page-actions">
            {onStart ? (
              <Button
                size="xs"
                variant="secondary"
                onClick={onStart}
                disabled={
                  startPending ||
                  stopPending ||
                  restartPending ||
                  container.state === "running" ||
                  container.state === "restarting"
                }
              >
                Start
              </Button>
            ) : null}
            {onStop ? (
              <Button
                size="xs"
                variant="secondary"
                onClick={onStop}
                disabled={
                  startPending ||
                  stopPending ||
                  restartPending ||
                  (container.state !== "running" && container.state !== "restarting")
                }
              >
                Stop
              </Button>
            ) : null}
            {onRestart ? (
              <Button
                size="xs"
                variant="secondary"
                onClick={onRestart}
                disabled={
                  startPending ||
                  stopPending ||
                  restartPending ||
                  container.state !== "running"
                }
              >
                Restart
              </Button>
            ) : null}
          </div>
        </div>

        <div className="docker-details-header">
          <span><strong>{container.name}</strong></span>
          <span>Status: {container.state}</span>
          <span>Health: {container.health_status}</span>
          <span>Image: {container.image_tag ?? container.image}</span>
          <span>Uptime: {formatUptime(container.uptime_seconds)}</span>
          <span>Restarts: {container.restart_count}</span>
          <span>Memory: {formatBytes(container.mem_bytes)}</span>
        </div>
      </Panel>

      <div className="ref-charts-grid" aria-label="Container charts">
        <TimeSeriesPanel
          title="CPU %"
          subtitle="Percent over time"
          rangeSelector={`${lastUpdated} (TZ: ${tz.toUpperCase()})`}
          status={statusFrom({ isLoading, error: metricsError, ...cpuState })}
        >
          <CpuPctChart
            metrics={metrics}
            isLoading={isLoading}
            error={metricsError}
            tz={tz}
            height={220}
            onStatus={setCpuState}
            onRetry={onMetricsRetry}
          />
        </TimeSeriesPanel>

        <TimeSeriesPanel
          title="Memory"
          subtitle={container.mem_limit_bytes ? `Limit ${formatBytes(container.mem_limit_bytes, { digits: 0 })}` : "Resident memory"}
          rangeSelector={`${lastUpdated} (TZ: ${tz.toUpperCase()})`}
          status={statusFrom({ isLoading, error: metricsError, ...memState })}
        >
          <MemoryBytesChart
            metrics={metrics}
            isLoading={isLoading}
            error={metricsError}
            tz={tz}
            height={220}
            memLimitBytes={container.mem_limit_bytes ?? null}
            onStatus={setMemState}
            onRetry={onMetricsRetry}
          />
        </TimeSeriesPanel>

        <TimeSeriesPanel
          title="Network RX/TX"
          subtitle="Bytes per second"
          rangeSelector={`${lastUpdated} (TZ: ${tz.toUpperCase()})`}
          status={statusFrom({ isLoading, error: metricsError, ...netState })}
        >
          <NetRateChart
            metrics={metrics}
            isLoading={isLoading}
            error={metricsError}
            tz={tz}
            height={240}
            onStatus={setNetState}
            onRetry={onMetricsRetry}
          />
        </TimeSeriesPanel>

        <TimeSeriesPanel
          title="Disk Read/Write"
          subtitle="Bytes per second"
          rangeSelector={`${lastUpdated} (TZ: ${tz.toUpperCase()})`}
          status={statusFrom({ isLoading, error: metricsError, ...diskState })}
        >
          <DiskRateChart
            metrics={metrics}
            isLoading={isLoading}
            error={metricsError}
            tz={tz}
            height={240}
            onStatus={setDiskState}
            onRetry={onMetricsRetry}
          />
        </TimeSeriesPanel>

        {canReadLogs ? (
          <div className="ref-chart-span-2">
            <TimeSeriesPanel
              title="Errors per minute"
              subtitle="Last 60 minutes (warn + error)"
              rangeSelector={
                errState.lastTsMs
                  ? `Updated ${formatTime(errState.lastTsMs, { tz, withSeconds: false })} (TZ: ${tz.toUpperCase()})`
                  : "No samples yet"
              }
              status={statusFrom({ isLoading: logsLoading, error: logsError, ...errState })}
            >
              <ErrorsPerMinuteChart
                logs={logs}
                isLoading={logsLoading}
                error={logsError}
                tz={tz}
                height={200}
                onStatus={setErrState}
                onRetry={onLogsRetry}
              />
            </TimeSeriesPanel>
          </div>
        ) : null}
      </div>
    </>
  );
}
