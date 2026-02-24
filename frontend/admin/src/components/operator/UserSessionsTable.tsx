import { useMemo, useState } from "react";
import { RelativeTime, Button, Skeleton, PrimitiveBadge } from "@vpn-suite/shared/ui";
import type { PeerListOut, PeerListItem } from "@vpn-suite/shared/types";
import { api } from "../../api/client";
import { useResource } from "../../hooks/useResource";

const TIME_OPTIONS = [
  { value: "15m", label: "15m" },
  { value: "1h", label: "1h" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "all", label: "All" },
] as const;

type TimeFilter = (typeof TIME_OPTIONS)[number]["value"];

function rangeToMs(value: TimeFilter): number | null {
  if (value === "15m") return 15 * 60_000;
  if (value === "1h") return 60 * 60_000;
  if (value === "24h") return 24 * 60 * 60_000;
  if (value === "7d") return 7 * 24 * 60 * 60_000;
  return null;
}

export function UserSessionsTable() {
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("24h");

  const sessions = useResource<PeerListOut>({
    source: "GET /peers?status=active",
    ttlMs: 15_000,
    isEmpty: (data) => !data?.peers?.length,
    fetcher: async ({ signal, requestId }) => {
      const started = Date.now();
      const data = await api.get<PeerListOut>("/peers?status=active&limit=200&offset=0", { signal });
      if (import.meta.env.DEV) {
        const ms = Date.now() - started;
        console.info("operator sessions fetch", { requestId, ms, total: data.total, returned: data.peers.length });
      }
      return data;
    },
  });

  const filtered = useMemo(() => {
    const rows = sessions.data?.peers ?? [];
    const q = search.trim().toLowerCase();
    const rangeMs = rangeToMs(timeFilter);
    const cutoff = rangeMs != null ? Date.now() - rangeMs : null;
    return rows.filter((r) => {
      if (cutoff != null && r.issued_at) {
        const ts = new Date(r.issued_at).getTime();
        if (Number.isFinite(ts) && ts < cutoff) return false;
      }
      if (!q) return true;
      const haystack = [
        r.peer_id,
        r.node_id,
        r.subscription_id,
        r.client_name,
        String(r.user_id),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [sessions.data?.peers, search, timeFilter]);

  if (sessions.status === "loading" || sessions.status === "idle") {
    return (
      <div className="operator-sessions-wrap">
        <div className="operator-sessions-toolbar">
          <input
            type="search"
            placeholder="Search sessions"
            className="operator-sessions-input"
            disabled
          />
          <select className="operator-sessions-select" disabled>
            {TIME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <Skeleton height={120} />
      </div>
    );
  }

  if (sessions.status === "error") {
    return (
      <div className="operator-sessions-wrap">
        <p className="operator-sessions-empty" role="alert">
          Failed to load sessions{sessions.error?.message ? `: ${sessions.error.message}` : ""}
        </p>
        <Button variant="ghost" size="sm" onClick={() => sessions.refresh()}>
          Retry
        </Button>
      </div>
    );
  }

  const rows = sessions.data?.peers ?? [];

  if (rows.length === 0) {
    return <p className="operator-sessions-empty">No active sessions</p>;
  }

  if (filtered.length === 0) {
    return (
      <div className="operator-sessions-wrap">
        <div className="operator-sessions-toolbar">
          <input
            type="search"
            placeholder="Search sessions"
            className="operator-sessions-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search sessions"
          />
          <select
            className="operator-sessions-select"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
            aria-label="Filter by time"
          >
            {TIME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <p className="operator-sessions-empty">No results match filters</p>
      </div>
    );
  }

  return (
    <div className="operator-sessions-wrap">
      <div className="operator-sessions-toolbar">
        <input
          type="search"
          placeholder="Search sessions"
          className="operator-sessions-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search sessions"
        />
        <select
          className="operator-sessions-select"
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
          aria-label="Filter by time"
        >
          {TIME_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="operator-sessions-meta">
          <span className="operator-sessions-updated">
            Updated:{" "}
            {sessions.updatedAt ? <RelativeTime date={sessions.updatedAt} updateInterval={5000} /> : "—"}
          </span>
          {sessions.status === "stale" ? (
            <PrimitiveBadge size="sm" variant="warning">Stale</PrimitiveBadge>
          ) : null}
        </div>
      </div>
      {import.meta.env.DEV ? (
        <div className="operator-sessions-debug">
          DEBUG · total={rows.length} · filtered={filtered.length} · range={timeFilter} · search={search || "—"}
        </div>
      ) : null}
      <table className="operator-sessions-table" aria-label="Active sessions">
        <thead>
          <tr>
            <th>Peer ID</th>
            <th>User</th>
            <th>Server</th>
            <th>Subscription</th>
            <th>Issued</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((row: PeerListItem) => (
            <tr key={row.peer_id}>
              <td className="operator-session-mono" title={row.peer_id}>{row.peer_id}</td>
              <td className="operator-session-mono">{row.user_id}</td>
              <td className="operator-session-mono" title={row.node_id}>{row.node_id}</td>
              <td className="operator-session-mono" title={row.subscription_id}>{row.subscription_id}</td>
              <td>{row.issued_at ? <RelativeTime date={row.issued_at} /> : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
