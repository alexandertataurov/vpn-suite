import { useMemo } from "react";
import {
  IconArrowUpRight,
  IconAuditLog,
  IconPlay,
  IconSquare,
  IconResync,
} from "@/design-system/icons";
import type { ContainerSummary } from "@vpn-suite/shared/types";
import { PrimitiveBadge, Button, Table, VirtualTable } from "@/design-system";
import { containerStatusToVariant, formatBytes } from "@vpn-suite/shared";

const ROW_HEIGHT = 44;
const VIEWPORT_HEIGHT = 360;

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
  items: ContainerSummary[];
  selectedId: string;
  onSelect: (containerId: string) => void;
  onOpenLogs: (containerId: string) => void;
  onStart?: (containerId: string) => void;
  onStop?: (containerId: string) => void;
  onRestart?: (containerId: string) => void;
  actionsDisabled?: boolean;
}

export function DockerOverviewTable({
  items,
  selectedId,
  onSelect,
  onOpenLogs,
  onStart,
  onStop,
  onRestart,
  actionsDisabled,
}: Props) {
  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Container",
        truncate: true,
        width: 170,
        titleTooltip: (item: ContainerSummary) => `${item.name} (${item.container_id.slice(0, 12)})`,
        render: (item: ContainerSummary) => item.name,
      },
      {
        key: "status",
        header: "Status",
        width: 120,
        render: (item: ContainerSummary) => (
          <PrimitiveBadge variant={containerStatusToVariant(item.state)}>{item.state}</PrimitiveBadge>
        ),
      },
      {
        key: "image",
        header: "Image",
        truncate: true,
        width: 220,
        titleTooltip: (item: ContainerSummary) => item.image,
        render: (item: ContainerSummary) => (item.image_tag ? `${item.image_tag}` : item.image),
      },
      {
        key: "compose",
        header: "Compose service",
        truncate: true,
        width: 160,
        render: (item: ContainerSummary) => item.compose_service ?? "—",
      },
      {
        key: "cpu",
        header: "CPU %",
        numeric: true,
        mono: true,
        width: 80,
        render: (item: ContainerSummary) => (item.cpu_pct != null ? `${item.cpu_pct.toFixed(1)}%` : "—"),
      },
      {
        key: "ram",
        header: "RAM",
        numeric: true,
        mono: true,
        truncate: true,
        width: 130,
        titleTooltip: (item: ContainerSummary) =>
          `${formatBytes(item.mem_bytes)}${item.mem_pct != null ? ` (${item.mem_pct.toFixed(1)}%)` : ""}`,
        render: (item: ContainerSummary) =>
          `${formatBytes(item.mem_bytes)}${item.mem_pct != null ? ` (${item.mem_pct.toFixed(1)}%)` : ""}`,
      },
      {
        key: "uptime",
        header: "Uptime",
        numeric: true,
        mono: true,
        width: 100,
        render: (item: ContainerSummary) => formatUptime(item.uptime_seconds),
      },
      {
        key: "ports",
        header: "Ports",
        mono: true,
        truncate: true,
        width: 210,
        titleTooltip: (item: ContainerSummary) =>
          item.ports.map((p) => `${p.public_port ?? "-"}:${p.private_port}/${p.protocol}`).join(", "),
        render: (item: ContainerSummary) => {
          const ports = item.ports
            .map((p) => `${p.public_port ?? "-"}:${p.private_port}/${p.protocol}`)
            .join(", ");
          return ports || "—";
        },
      },
      {
        key: "actions",
        header: "Actions",
        actions: true,
        width: 88,
        minWidth: 88,
        className: "docker-overview-actions-cell",
        render: (item: ContainerSummary) => {
          const canStart =
            !!onStart &&
            item.state !== "running" &&
            item.state !== "restarting";
          const canStop =
            !!onStop &&
            (item.state === "running" || item.state === "restarting");
          const canRestart =
            !!onRestart && item.state === "running";
          return (
            <div className="table-actions docker-overview-actions">
              {onStart ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(event) => {
                    event.stopPropagation();
                    onStart(item.container_id);
                  }}
                  aria-label={`Start ${item.name}`}
                  title="Start"
                  disabled={actionsDisabled || !canStart}
                >
                  <IconPlay aria-hidden size={14} strokeWidth={1.5} />
                </Button>
              ) : null}
              {onStop ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(event) => {
                    event.stopPropagation();
                    onStop(item.container_id);
                  }}
                  aria-label={`Stop ${item.name}`}
                  title="Stop"
                  disabled={actionsDisabled || !canStop}
                >
                  <IconSquare aria-hidden size={14} strokeWidth={1.5} />
                </Button>
              ) : null}
              {onRestart ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRestart(item.container_id);
                  }}
                  aria-label={`Restart ${item.name}`}
                  title="Restart"
                  disabled={actionsDisabled || !canRestart}
                >
                  <IconResync aria-hidden size={14} strokeWidth={1.5} />
                </Button>
              ) : null}
              <Button
                variant="ghost"
                size="icon"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(item.container_id);
                }}
                aria-label={`View details for ${item.name}`}
                title="Details"
              >
                <IconArrowUpRight aria-hidden size={14} strokeWidth={1.5} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenLogs(item.container_id);
                }}
                aria-label={`Open logs for ${item.name}`}
                title="Logs"
              >
                <IconAuditLog aria-hidden size={14} strokeWidth={1.5} />
              </Button>
            </div>
          );
        },
      },
    ],
    [actionsDisabled, onOpenLogs, onRestart, onSelect, onStart, onStop]
  );

  const commonProps = {
    columns,
    data: items,
    className: "telemetry-docker-table table-density-compact",
    density: "compact" as const,
    keyExtractor: (item: ContainerSummary) => item.container_id,
    emptyTitle: "No containers match the current filters",
    emptyHint: "Adjust the filters above to see Docker containers.",
    rowClassName: (item: ContainerSummary) =>
      item.container_id === selectedId ? "table-row-selected" : undefined,
    onRowClick: (item: ContainerSummary) => onSelect(item.container_id),
  };

  if (items.length > 200) {
    return (
      <VirtualTable<ContainerSummary>
        {...commonProps}
        maxHeight={VIEWPORT_HEIGHT}
        rowHeight={ROW_HEIGHT}
        overscan={6}
      />
    );
  }

  return <Table<ContainerSummary> {...commonProps} />;
}
