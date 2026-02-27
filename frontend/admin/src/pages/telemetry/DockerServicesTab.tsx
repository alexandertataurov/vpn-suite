import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PrimitiveBadge,
  Panel,
  Input,
  PageError,
  Select,
  Skeleton,
  Button,
  useToast,
} from "@vpn-suite/shared/ui";
import { DataSourceHealthStrip } from "../../components/telemetry/DataSourceHealthStrip";
import type { ContainerLogLine } from "@vpn-suite/shared/types";
import { ApiError } from "@vpn-suite/shared/types";
import { formatBytes, getErrorMessage } from "@vpn-suite/shared";
import {
  useContainerLogs,
  useContainerMetrics,
  useDockerAlerts,
  useDockerContainers,
  useDockerHosts,
} from "../../hooks/useDockerTelemetry";
import { DOCKER_TELEMETRY_KEY } from "../../api/query-keys";
import { api } from "../../api/client";
import { AlertsPanel } from "./AlertsPanel";
import { ContainerDetailsPanel } from "./ContainerDetailsPanel";
import { DockerOverviewTable } from "./DockerOverviewTable";
import { LogsViewer } from "./LogsViewer";
import { TelemetryKpiGrid } from "../../components/telemetry/TelemetryKpiGrid";
import { TableSection } from "../../components/TableSection";

export function DockerServicesTab() {
  // Do not assume any default host exists. When DOCKER_TELEMETRY_HOSTS_JSON is unset,
  // /telemetry/docker/hosts returns an empty list and we must not poll /containers with "local".
  const [hostId, setHostId] = useState("");
  const [selectedContainerId, setSelectedContainerId] = useState("");
  const [overviewIntervalMs, setOverviewIntervalMs] = useState(8000);
  const [detailIntervalMs, setDetailIntervalMs] = useState(3000);
  const [nameFilter, setNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [imageFilter, setImageFilter] = useState("");
  const [composeFilter, setComposeFilter] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "cpu" | "mem" | "uptime">("name");
  const [metricsRange, setMetricsRange] = useState("1h");
  const [metricsStep, setMetricsStep] = useState("15s");
  const [logsCursor, setLogsCursor] = useState<string | null>(null);
  const [logsPollingEnabled, setLogsPollingEnabled] = useState(true);
  const [logLines, setLogLines] = useState<ContainerLogLine[]>([]);

  const queryClient = useQueryClient();
  const addToast = useToast();

  const hostsQuery = useDockerHosts(overviewIntervalMs);
  const containersQuery = useDockerContainers(hostId, overviewIntervalMs);
  const metricsQuery = useContainerMetrics(
    hostId,
    selectedContainerId,
    metricsRange,
    metricsStep,
    detailIntervalMs
  );
  const logsQuery = useContainerLogs(
    hostId,
    selectedContainerId,
    200,
    logsCursor,
    logsPollingEnabled,
    detailIntervalMs
  );
  const alertsQuery = useDockerAlerts(hostId, overviewIntervalMs);

  const invalidateContainers = () => {
    if (!hostId) return;
    queryClient.invalidateQueries({
      queryKey: [...DOCKER_TELEMETRY_KEY, "containers", hostId],
    });
    hostsQuery.refetch();
  };

  const startMutation = useMutation({
    mutationFn: (containerId: string) =>
      api.post<void>(
        `/telemetry/docker/container/${encodeURIComponent(
          containerId,
        )}/start?host_id=${encodeURIComponent(hostId)}`,
      ),
    onSuccess: () => {
      invalidateContainers();
      addToast("Container start requested", "success");
    },
    onError: (err) => {
      addToast(getErrorMessage(err, "Start failed"), "error");
    },
  });

  const stopMutation = useMutation({
    mutationFn: (containerId: string) =>
      api.post<void>(
        `/telemetry/docker/container/${encodeURIComponent(
          containerId,
        )}/stop?host_id=${encodeURIComponent(hostId)}`,
      ),
    onSuccess: () => {
      invalidateContainers();
      addToast("Container stop requested", "success");
    },
    onError: (err) => {
      addToast(getErrorMessage(err, "Stop failed"), "error");
    },
  });

  const restartMutation = useMutation({
    mutationFn: (containerId: string) =>
      api.post<void>(
        `/telemetry/docker/container/${encodeURIComponent(
          containerId,
        )}/restart?host_id=${encodeURIComponent(hostId)}`,
      ),
    onSuccess: () => {
      invalidateContainers();
      addToast("Container restart requested", "success");
    },
    onError: (err) => {
      addToast(getErrorMessage(err, "Restart failed"), "error");
    },
  });

  const safeLower = (v: unknown): string => (typeof v === "string" ? v.toLowerCase() : "");
  const safeTrimLower = (v: unknown): string => (typeof v === "string" ? v.trim().toLowerCase() : "");
  const safeStr = (v: unknown): string => (typeof v === "string" ? v : "");

  const hostsItems = useMemo(() => hostsQuery.data?.items ?? [], [hostsQuery.data?.items]);
  const hostIdsKey = useMemo(
    () => hostsItems.map((h) => h.host_id).join(",") ?? "",
    [hostsItems]
  );
  useEffect(() => {
    const first = hostsItems[0]?.host_id;
    if (first && !hostsItems.some((h) => h.host_id === hostId)) {
      setHostId(first);
    }
  }, [hostId, hostIdsKey, hostsItems]);

  useEffect(() => {
    const list = containersQuery.data?.items ?? [];
    const exists = list.some((item) => item.container_id === selectedContainerId);
    if (!exists) {
      setSelectedContainerId(list[0]?.container_id ?? "");
    }
  }, [containersQuery.data?.items, selectedContainerId]);

  useEffect(() => {
    setLogsCursor(null);
    setLogLines([]);
    setLogsPollingEnabled(true);
  }, [selectedContainerId, hostId]);

  useEffect(() => {
    if (!logsQuery.data?.items || logsQuery.data.items.length === 0) return;
    const incoming = logsQuery.data.items;
    setLogLines((prev) => {
      const merged = [...prev, ...incoming];
      const deduped = new Map<string, ContainerLogLine>();
      for (const line of merged) {
        const key = `${line.ts}|${line.stream}|${line.message}`;
        deduped.set(key, line);
      }
      return Array.from(deduped.values()).slice(-800);
    });
    setLogsCursor(incoming[incoming.length - 1]?.ts ?? null);
  }, [logsQuery.data?.items]);

  const filtered = useMemo(() => {
    const rows = containersQuery.data?.items ?? [];
    const nf = safeTrimLower(nameFilter);
    const im = safeTrimLower(imageFilter);
    const cs = safeTrimLower(composeFilter);
    let out = rows.filter((item) => {
      const name = safeLower(item?.name);
      const image = safeLower(item?.image);
      const composeService = safeLower(item?.compose_service);
      if (nf && !name.includes(nf)) return false;
      if (statusFilter !== "all" && item.state !== statusFilter) return false;
      if (im && !image.includes(im)) return false;
      if (cs && !composeService.includes(cs)) return false;
      return true;
    });
    out = [...out].sort((a, b) => {
      if (sortKey === "cpu") return (b.cpu_pct ?? -1) - (a.cpu_pct ?? -1);
      if (sortKey === "mem") return (b.mem_bytes ?? -1) - (a.mem_bytes ?? -1);
      if (sortKey === "uptime") return (b.uptime_seconds ?? -1) - (a.uptime_seconds ?? -1);
      return safeStr(a?.name).localeCompare(safeStr(b?.name));
    });
    return out;
  }, [composeFilter, containersQuery.data?.items, imageFilter, nameFilter, sortKey, statusFilter]);

  const selectedContainer = useMemo(
    () => (containersQuery.data?.items ?? []).find((item) => item.container_id === selectedContainerId) ?? null,
    [containersQuery.data?.items, selectedContainerId]
  );

  const summary = useMemo(() => {
    const rows = containersQuery.data?.items ?? [];
    const running = rows.filter((r) => r.state === "running").length;
    const unhealthy = rows.filter((r) => r.health_status === "unhealthy").length;
    const loops = rows.filter((r) => r.is_restart_loop).length;
    const topCpu = [...rows].sort((a, b) => (b.cpu_pct ?? -1) - (a.cpu_pct ?? -1))[0];
    const topMem = [...rows].sort((a, b) => (b.mem_bytes ?? -1) - (a.mem_bytes ?? -1))[0];
    return {
      total: rows.length,
      running,
      unhealthy,
      loops,
      topCpu,
      topMem,
    };
  }, [containersQuery.data?.items]);

  const logsForbidden = logsQuery.error instanceof ApiError && logsQuery.error.statusCode === 403;

  useEffect(() => {
    if (logsForbidden) {
      setLogsPollingEnabled(false);
    }
  }, [logsForbidden]);

  const dockerUnavailable = hostsQuery.error instanceof ApiError && hostsQuery.error.statusCode === 503;
  const dockerNotConfigured =
    !hostsQuery.isLoading && !hostsQuery.error && (hostsQuery.data?.items?.length ?? 0) === 0;

  if (dockerUnavailable || dockerNotConfigured) {
    return (
      <Panel as="div" variant="outline" data-testid="docker-telemetry-unavailable">
        <p className="ref-chart-subtitle">
          Docker telemetry is not configured. In production set{" "}
          <code>DOCKER_TELEMETRY_HOSTS_JSON</code> (e.g.{" "}
          <code>{'[{"host_id":"local","base_url":"unix:///var/run/docker.sock"}]'}</code>
          ) to enable this view.
        </p>
      </Panel>
    );
  }
  if (hostsQuery.error || containersQuery.error) {
    return (
      <PageError
        message="Failed to load Docker telemetry"
        onRetry={() => {
          hostsQuery.refetch();
          containersQuery.refetch();
        }}
      />
    );
  }

  const dockerApiStatus =
    hostsQuery.error || containersQuery.error ? "down" : "ok";
  const dockerLastFetch =
    hostsQuery.dataUpdatedAt ?? containersQuery.dataUpdatedAt ?? null;

  return (
    <div className="ref-telemetry-stack">
      <DataSourceHealthStrip
        apiStatus={dockerApiStatus}
        lastSuccessfulFetch={dockerLastFetch}
        refreshInterval={`${overviewIntervalMs / 1000}s`}
        timeRange={metricsRange}
        inferred
        isOffline={typeof navigator !== "undefined" && !navigator.onLine}
      />
      <Panel as="section" variant="outline" aria-label="Docker controls">
        <div className="ref-section-head">
          <h3 className="ref-settings-title">Live controls</h3>
          <PrimitiveBadge variant={hostsQuery.isFetching ? "warning" : "success"}>
            {hostsQuery.isFetching ? "Refreshing" : "Live"}
          </PrimitiveBadge>
        </div>
        <div className="actions-row flex-wrap">
          <Select
            label="Host"
            options={(hostsQuery.data?.items ?? []).map((host) => ({
              value: host.host_id,
              label: `${host.name} (${host.host_id})`,
            }))}
            value={hostId}
            onChange={setHostId}
            aria-label="Docker host selector"
            className="w-auto"
          />
          <Select
            label="Overview refresh"
            options={[
              { value: "5000", label: "5s" },
              { value: "8000", label: "8s" },
              { value: "10000", label: "10s" },
            ]}
            value={String(overviewIntervalMs)}
            onChange={(v) => setOverviewIntervalMs(Number(v) || 8000)}
            className="w-auto"
          />
          <Select
            label="Details refresh"
            options={[
              { value: "2000", label: "2s" },
              { value: "3000", label: "3s" },
              { value: "5000", label: "5s" },
            ]}
            value={String(detailIntervalMs)}
            onChange={(v) => setDetailIntervalMs(Number(v) || 3000)}
            className="w-auto"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (!selectedContainerId || !hostId) return;
              restartMutation.mutate(selectedContainerId);
            }}
            disabled={
              !selectedContainerId ||
              !hostId ||
              startMutation.isPending ||
              stopMutation.isPending ||
              restartMutation.isPending
            }
          >
            Restart selected
          </Button>
        </div>
      </Panel>

      <TelemetryKpiGrid
        items={[
          {
            id: "docker-total",
            label: "Total containers",
            value: containersQuery.isLoading ? "…" : summary.total,
            hint: "all running + stopped",
          },
          {
            id: "docker-running",
            label: "Running",
            value: containersQuery.isLoading ? "…" : summary.running,
            hint: "healthy runtime",
          },
          {
            id: "docker-unhealthy-loops",
            label: "Unhealthy / loops",
            value: containersQuery.isLoading
              ? "…"
              : `${summary.unhealthy} / ${summary.loops}`,
            hint: "healthcheck + restart loop",
          },
          {
            id: "docker-top",
            label: "Top CPU / RAM",
            value: containersQuery.isLoading
              ? "…"
              : summary.topCpu?.name ?? "—",
            hint: summary.topMem
              ? `${summary.topMem.name}: ${formatBytes(summary.topMem.mem_bytes)}`
              : "—",
          },
        ]}
      />

      <TableSection
        title="Docker overview"
        actions={
          <div className="docker-overview-meta">
            <PrimitiveBadge variant="neutral" size="sm">
              {containersQuery.isLoading ? "Loading containers…" : `${summary.total} containers`}
            </PrimitiveBadge>
            {!containersQuery.isLoading ? (
              <>
                <PrimitiveBadge variant="success" size="sm">
                  {summary.running} running
                </PrimitiveBadge>
                <PrimitiveBadge
                  variant={summary.unhealthy > 0 || summary.loops > 0 ? "danger" : "neutral"}
                  size="sm"
                >
                  {summary.unhealthy} unhealthy / {summary.loops} loops
                </PrimitiveBadge>
              </>
            ) : null}
          </div>
        }
      >
        <p className="ref-settings-text">
          Filter Docker services by name, state, image, or compose service. Use the actions column to inspect metrics and logs.
        </p>

        <div className="docker-filters-grid">
          <Input label="Name" value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} />
          <Select
            label="State"
            options={[
              { value: "all", label: "All" },
              { value: "running", label: "Running" },
              { value: "exited", label: "Exited" },
              { value: "restarting", label: "Restarting" },
              { value: "paused", label: "Paused" },
              { value: "dead", label: "Dead" },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <Input label="Image" value={imageFilter} onChange={(e) => setImageFilter(e.target.value)} />
          <Input label="Compose service" value={composeFilter} onChange={(e) => setComposeFilter(e.target.value)} />
          <Select
            label="Sort"
            options={[
              { value: "name", label: "Name" },
              { value: "cpu", label: "CPU" },
              { value: "mem", label: "Memory" },
              { value: "uptime", label: "Uptime" },
            ]}
            value={sortKey}
            onChange={(v) => setSortKey(v as "name" | "cpu" | "mem" | "uptime")}
          />
        </div>

        {containersQuery.isLoading ? (
          <Skeleton height={220} />
        ) : (
          <DockerOverviewTable
            items={filtered}
            selectedId={selectedContainerId}
            onSelect={setSelectedContainerId}
            onOpenLogs={setSelectedContainerId}
            onStart={
              hostId ? (id) => startMutation.mutate(id) : undefined
            }
            onStop={
              hostId ? (id) => stopMutation.mutate(id) : undefined
            }
            onRestart={
              hostId ? (id) => restartMutation.mutate(id) : undefined
            }
            actionsDisabled={
              !hostId ||
              startMutation.isPending ||
              stopMutation.isPending ||
              restartMutation.isPending
            }
          />
        )}
      </TableSection>

      <Panel as="section" variant="outline" aria-label="Metrics controls">
        <div className="ref-section-head">
          <h3 className="ref-settings-title">Metrics range</h3>
        </div>
        <div className="actions-row flex-wrap">
          <Select
            label="Range"
            options={[
              { value: "15m", label: "15m" },
              { value: "1h", label: "1h" },
              { value: "6h", label: "6h" },
              { value: "24h", label: "24h" },
            ]}
            value={metricsRange}
            onChange={setMetricsRange}
            className="w-auto"
          />
          <Select
            label="Step"
            options={[
              { value: "5s", label: "5s" },
              { value: "15s", label: "15s" },
              { value: "30s", label: "30s" },
              { value: "60s", label: "60s" },
            ]}
            value={metricsStep}
            onChange={setMetricsStep}
            className="w-auto"
          />
        </div>
      </Panel>

      <ContainerDetailsPanel
        container={selectedContainer}
        metrics={metricsQuery.data}
        metricsError={metricsQuery.error}
        isLoading={metricsQuery.isLoading}
        canReadLogs={!logsForbidden && Boolean(selectedContainerId)}
        logs={logLines}
        logsLoading={logsQuery.isLoading}
        logsError={logsForbidden ? undefined : logsQuery.error}
        onMetricsRetry={() => metricsQuery.refetch()}
        onLogsRetry={() => logsQuery.refetch()}
        onStart={
          selectedContainer && hostId
            ? () => startMutation.mutate(selectedContainer.container_id)
            : undefined
        }
        onStop={
          selectedContainer && hostId
            ? () => stopMutation.mutate(selectedContainer.container_id)
            : undefined
        }
        onRestart={
          selectedContainer && hostId
            ? () => restartMutation.mutate(selectedContainer.container_id)
            : undefined
        }
        startPending={startMutation.isPending}
        stopPending={stopMutation.isPending}
        restartPending={restartMutation.isPending}
      />

      <LogsViewer
        logs={logLines}
        isLoading={logsQuery.isLoading}
        canReadLogs={!logsForbidden && Boolean(selectedContainerId)}
        error={logsForbidden ? null : logsQuery.error}
      />

      <AlertsPanel
        items={alertsQuery.data?.items ?? []}
        isLoading={alertsQuery.isLoading}
        error={alertsQuery.error}
      />
    </div>
  );
}
