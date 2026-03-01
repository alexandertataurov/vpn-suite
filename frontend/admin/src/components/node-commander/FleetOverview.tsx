import { useMemo } from "react";
import { MiniWaveform } from "../data/MiniWaveform";
import type { ServerOut } from "@vpn-suite/shared/types";
import type { ServersSnapshotSummaryOut } from "../../hooks/useServerList";
import { STATUS_TOKENS, type StatusVariant } from "@/design-system";

export interface FleetOverviewProps {
  servers: ServerOut[];
  snapshotSummary?: ServersSnapshotSummaryOut | null;
  selectedId: string | null;
  onSelect: (server: ServerOut) => void;
}

function waveformFromCpu(cpuPct: number | null | undefined): number[] {
  const base = cpuPct != null ? Math.min(1, cpuPct / 100) : 0.3;
  return Array.from({ length: 20 }, (_, i) => base * (0.7 + 0.3 * Math.sin(i * 0.5)));
}

export function FleetOverview({ servers, snapshotSummary, selectedId, onSelect }: FleetOverviewProps) {
  const items = useMemo(() => {
    return servers.map((s) => {
      const snap = snapshotSummary?.servers?.[s.id];
      const cpu = snap?.cpu_pct;
      const data = waveformFromCpu(cpu);
      const status = (s.status ?? "unknown").toLowerCase();
      const variant: StatusVariant =
        status === "online" ? "nominal" :
        status === "offline" ? "abort" :
        "standby";
      const stroke = STATUS_TOKENS[variant].color;
      return { server: s, data, stroke };
    });
  }, [servers, snapshotSummary]);

  return (
    <div className="fleet-overview" role="list">
      {items.map(({ server, data, stroke }) => {
        const isSelected = server.id === selectedId;
        const ip = server.api_endpoint?.replace(/^https?:\/\//, "").split("/")[0] ?? server.vpn_endpoint ?? "—";
        return (
          <button
            key={server.id}
            type="button"
            role="listitem"
            className={`fleet-overview-item ${isSelected ? "fleet-overview-item--selected" : ""}`}
            onClick={() => onSelect(server)}
            aria-pressed={isSelected}
            aria-label={`${server.name ?? server.id} ${server.status ?? "unknown"}`}
          >
            <div className="fleet-overview-waveform">
              <MiniWaveform data={data} width={40} height={14} stroke={stroke} />
            </div>
            <div className="fleet-overview-meta">
              <span className="fleet-overview-name">{server.name ?? server.id}</span>
              <span className="fleet-overview-ip">{ip}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
