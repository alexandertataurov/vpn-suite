import { useState } from "react";
import { Link } from "react-router-dom";
import { IconCheck, IconChevronDown, IconChevronRight } from "@/design-system/icons";
import { Button, PrimitiveBadge, RelativeTime } from "@/design-system";
import type { OperatorIncident } from "@vpn-suite/shared/types";
import type { ResourceState } from "../../hooks/useResource";

interface IncidentPanelProps {
  resource: ResourceState<OperatorIncident[]>;
  onRetry?: () => void;
}

export function IncidentPanel({ resource, onRetry }: IncidentPanelProps) {
  const [expanded, setExpanded] = useState(true);

  if (resource.status === "loading" || resource.status === "idle") {
    return <p className="operator-incident-empty">Loading incidents…</p>;
  }

  if (resource.status === "error") {
    return (
      <div className="operator-incident-empty" role="alert">
        Incident feed unavailable{resource.error?.message ? `: ${resource.error.message}` : ""}
        {onRetry ? (
          <div className="operator-incident-retry">
            <Button variant="ghost" size="sm" onClick={onRetry}>
              Retry
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  const incidents = resource.data ?? [];

  if (incidents.length === 0) {
    return (
      <div className="operator-incident-empty-state" role="status">
        <IconCheck className="operator-incident-empty-icon" aria-hidden size={20} strokeWidth={1.5} />
        <span>No active incidents</span>
      </div>
    );
  }

  return (
    <div className="operator-incident-panel">
      {(resource.status === "stale" || resource.updatedAt) && (
        <div className="operator-panel-meta operator-panel-meta--minimal">
          {resource.status === "stale" ? (
            <PrimitiveBadge variant="warning" size="sm">Stale</PrimitiveBadge>
          ) : null}
        </div>
      )}
      <button
        type="button"
        className="operator-incident-toggle"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-label={expanded ? "Collapse incidents" : "Expand incidents"}
      >
        {expanded ? <IconChevronDown size={14} strokeWidth={1.5} aria-hidden /> : <IconChevronRight size={14} strokeWidth={1.5} aria-hidden />}
        <span>{incidents.length} active</span>
      </button>
      {expanded && (
      <ul className="operator-incident-list">
        {incidents.map((inc, i) => (
          <li key={`${inc.entity}-${inc.metric}-${i}`} className="operator-incident-item">
            <span className="operator-incident-badges">
              <span className={`operator-incident-severity operator-incident-severity--${inc.severity}`}>
                {inc.severity}
              </span>
              <span className={`operator-incident-status operator-incident-status--${inc.status ?? "open"}`}>
                {inc.status ?? "open"}
              </span>
            </span>
            <span className="operator-incident-desc">
              {inc.entity} · {inc.metric}: {String(inc.value)}
            </span>
            <span className="operator-incident-affected">
              {(inc.affected_servers ?? 1).toLocaleString()} affected
            </span>
            <span className="operator-incident-time">
              Age <RelativeTime date={inc.timestamp} title={new Date(inc.timestamp).toISOString()} />
            </span>
            <span className="operator-incident-ack">Ack: {String((inc as unknown as { acknowledged_by?: string | null }).acknowledged_by ?? "—")}</span>
            <Link to={inc.link} className="operator-incident-link">
              View →
            </Link>
          </li>
        ))}
      </ul>
      )}
    </div>
  );
}
