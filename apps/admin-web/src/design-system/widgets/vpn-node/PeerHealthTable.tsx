import { useMemo } from "react";
import { DataTable } from "@/design-system/primitives/DataTable";
import { formatHandshakeAge } from "@/features/vpn-nodes/format";
import { formatMs, formatPct, dash } from "@/features/vpn-nodes/format";
import type { VpnNodePeerRow } from "@/features/vpn-nodes/types";

interface PeerTableRow extends Record<string, unknown> {
  public_key: string;
  device_name: string;
  tunnel_ip: string;
  last_handshake_age: string;
  rx: string;
  tx: string;
  rtt_ms: string;
  loss_pct: string;
  status: string;
}

const PEER_COLUMNS = [
  { key: "device_name" as const, header: "Device", title: "Device label" },
  { key: "tunnel_ip" as const, header: "Tunnel IP", title: "Allowed IPs" },
  { key: "last_handshake_age" as const, header: "Handshake", title: "Last handshake age" },
  { key: "rx" as const, header: "RX", title: "Receive bytes" },
  { key: "tx" as const, header: "TX", title: "Transmit bytes" },
  { key: "rtt_ms" as const, header: "RTT", title: "RTT ms" },
  { key: "loss_pct" as const, header: "Loss", title: "Packet loss %" },
  { key: "status" as const, header: "Status" },
];

function peerToRow(p: VpnNodePeerRow): PeerTableRow {
  return {
    public_key: p.public_key,
    device_name: dash(p.device_name ?? p.peer_id),
    tunnel_ip: dash(p.allowed_ips),
    last_handshake_age: formatHandshakeAge(p.last_handshake_ts ?? undefined),
    rx: p.rx_bytes != null ? String(p.rx_bytes) : "—",
    tx: p.tx_bytes != null ? String(p.tx_bytes) : "—",
    rtt_ms: p.rtt_ms != null ? formatMs(p.rtt_ms) : "—",
    loss_pct: p.loss_pct != null ? formatPct(p.loss_pct) : "—",
    status: p.status ?? "unknown",
  };
}

export function PeerHealthTable({ peers }: { peers: VpnNodePeerRow[] }) {
  const rows = useMemo(() => peers.map(peerToRow), [peers]);

  const getRowClassName = (row: PeerTableRow) => {
    if (row.status === "ok") return "row-success";
    if (row.status === "degraded") return "row-warning";
    return "row-danger";
  };

  return (
    <DataTable<PeerTableRow>
      columns={PEER_COLUMNS}
      rows={rows}
      getRowKey={(r) => r.public_key}
      density="compact"
      getRowClassName={getRowClassName}
    />
  );
}
