import { useMemo } from "react";
import { ArrowUpRight, FileText } from "lucide-react";
import type { ContainerSummary } from "@vpn-suite/shared/types";
import { PrimitiveBadge, Button, VirtualTable } from "@vpn-suite/shared/ui";
import { containerStatusToVariant, formatBytes } from "@vpn-suite/shared";

const ROW_HEIGHT = 48;
const VIEWPORT_HEIGHT = 420;

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
}

export function DockerOverviewTable({ items, selectedId, onSelect, onOpenLogs }: Props) {
  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        truncate: true,
        width: 170,
        titleTooltip: (item: ContainerSummary) => item.name,
        render: (item: ContainerSummary) => item.name,
      },
      {
        key: "status",
        header: "Status",
        width: 110,
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
        header: "CPU",
        numeric: true,
        width: 74,
        render: (item: ContainerSummary) => (item.cpu_pct != null ? `${item.cpu_pct.toFixed(1)}%` : "—"),
      },
      {
        key: "ram",
        header: "RAM",
        numeric: true,
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
        width: 90,
        render: (item: ContainerSummary) => formatUptime(item.uptime_seconds),
      },
      {
        key: "ports",
        header: "Ports",
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
        render: (item: ContainerSummary) => (
          <div className="table-actions docker-overview-actions">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSelect(item.container_id)}
              aria-label={`View details for ${item.name}`}
              title="Details"
            >
              <ArrowUpRight aria-hidden strokeWidth={1.5} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenLogs(item.container_id)}
              aria-label={`Open logs for ${item.name}`}
              title="Logs"
            >
              <FileText aria-hidden strokeWidth={1.5} />
            </Button>
          </div>
        ),
      },
    ],
    [onOpenLogs, onSelect]
  );

  if (items.length === 0) {
    return <p className="text-muted">No containers match the current filters.</p>;
  }

  return (
    <VirtualTable<ContainerSummary>
      columns={columns}
      data={items}
      className="telemetry-docker-table"
      keyExtractor={(item) => item.container_id}
      height={VIEWPORT_HEIGHT}
      rowHeight={ROW_HEIGHT}
      overscan={6}
      rowClassName={(item) => (item.container_id === selectedId ? "table-row-selected" : undefined)}
    />
  );
}
