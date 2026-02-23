import { Link } from "react-router-dom";
import { RelativeTime } from "@vpn-suite/shared/ui";
import type { OperatorIncident } from "@vpn-suite/shared/types";

interface IncidentPanelProps {
  incidents?: OperatorIncident[] | null;
}

export function IncidentPanel({ incidents }: IncidentPanelProps) {
  if (!incidents) {
    return <p className="operator-incident-empty">Incidents unavailable</p>;
  }

  if (incidents.length === 0) {
    return <p className="operator-incident-empty">No active incidents</p>;
  }

  return (
    <ul className="operator-incident-list">
      {incidents.map((inc, i) => (
        <li key={`${inc.entity}-${inc.metric}-${i}`} className="operator-incident-item">
          <span className="operator-incident-badges">
            <span className={`operator-incident-severity operator-incident-severity--${inc.severity}`}>
              {inc.severity}
            </span>
            <span className="operator-incident-status">{inc.status ?? "open"}</span>
          </span>
          <span className="operator-incident-desc">
            {inc.entity} · {inc.metric}: {String(inc.value)}
          </span>
          <span className="operator-incident-affected">
            {(inc.affected_servers ?? 1).toLocaleString()} affected
          </span>
          <span className="operator-incident-time">
            <RelativeTime date={inc.timestamp} title={new Date(inc.timestamp).toISOString()} />
          </span>
          <Link to={inc.link} className="operator-incident-link">
            View →
          </Link>
        </li>
      ))}
    </ul>
  );
}
