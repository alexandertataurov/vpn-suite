import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RelativeTime, Button, Skeleton, PrimitiveBadge } from "@/design-system";
import { TruncatedId } from "../data/TruncatedId";
import type { PeerListOut, PeerListItem } from "@vpn-suite/shared/types";
import { api } from "../../api/client";
import { PEERS_LIST_KEY } from "../../api/query-keys";
import { shouldRetryQuery } from "../../utils/queryPolicy";
import { useResourceFromQuery } from "../../hooks/useResource";

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

const LOADING_STALE_MS = 15_000;
const LOADING_HARD_TIMEOUT_MS = 55_000;

export function UserSessionsTable() {
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("24h");
  const [loadingSince, setLoadingSince] = useState<number | null>(null);
  const [hardTimeoutHit, setHardTimeoutHit] = useState(false);

  const peersQuery = useQuery<PeerListOut>({
    queryKey: [...PEERS_LIST_KEY, "active", 200, 0],
    queryFn: ({ signal }) =>
      api.get<PeerListOut>("/peers?status=active&limit=200&offset=0", { signal }),
    staleTime: 15_000,
    retry: shouldRetryQuery,
  });

  const sessions = useResourceFromQuery<PeerListOut>(
    "GET /peers?status=active",
    [...PEERS_LIST_KEY, "active", 200, 0],
    peersQuery,
    15_000,
    { isEmpty: (data) => !data?.peers?.length }
  );

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

  const isPending =
    sessions.status === "loading" ||
    sessions.status === "idle" ||
    (sessions.status === "empty" && !sessions.updatedAt);

  useEffect(() => {
    if (isPending) setLoadingSince((t) => t ?? Date.now());
    else setLoadingSince(null);
  }, [isPending]);

  useEffect(() => {
    if (!isPending || loadingSince == null) return;
    const t = setTimeout(() => setHardTimeoutHit(true), LOADING_HARD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [isPending, loadingSince]);

  useEffect(() => {
    if (!isPending) setHardTimeoutHit(false);
  }, [isPending]);

  const loadingStale = loadingSince != null && Date.now() - loadingSince > LOADING_STALE_MS;
  const loadingTimedOut = hardTimeoutHit;

  if (loadingTimedOut) {
    return (
      <div className="operator-sessions-wrap">
        <p className="operator-sessions-empty" role="alert">
          Sessions request did not complete. The request may have timed out or the server may be unreachable.
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setHardTimeoutHit(false);
            sessions.refresh();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (isPending) {
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
          {loadingStale ? (
            <Button variant="ghost" size="sm" onClick={() => sessions.refresh()} aria-label="Retry loading sessions">
              Retry
            </Button>
          ) : null}
        </div>
        <Skeleton height={120} aria-busy="true" aria-label="Loading sessions" />
        {loadingStale ? (
          <p className="operator-sessions-empty" role="status">
            Taking longer than expected. Check network or retry.
          </p>
        ) : null}
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
          {sessions.data && sessions.data.total > rows.length ? (
            <span className="operator-sessions-truncated">
              Showing {rows.length} of {sessions.data.total} sessions
            </span>
          ) : null}
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
              <td className="operator-session-mono">
                {row.peer_id ? <TruncatedId value={row.peer_id} aria-label={`Copy peer ID ${row.peer_id.slice(0, 8)}…`} /> : "—"}
              </td>
              <td className="operator-session-mono">{row.user_id}</td>
              <td className="operator-session-mono">
                {row.node_id ? <TruncatedId value={row.node_id} aria-label={`Copy node ID ${row.node_id.slice(0, 8)}…`} /> : "—"}
              </td>
              <td className="operator-session-mono">
                {row.subscription_id ? <TruncatedId value={row.subscription_id} aria-label={`Copy subscription ID ${row.subscription_id.slice(0, 8)}…`} /> : "—"}
              </td>
              <td>{row.issued_at ? <RelativeTime date={row.issued_at} /> : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
