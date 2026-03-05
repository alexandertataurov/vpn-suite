import { dash } from "@/features/vpn-nodes/format";
import type { VpnNodeAlert } from "@/features/vpn-nodes/types";

interface AlertDetailsProps {
  alerts: VpnNodeAlert[];
  runbookUrl?: string | null;
  className?: string;
}

function formatSince(since: string | number | null | undefined): string {
  if (since == null) return "—";
  if (typeof since === "number") return String(since);
  try {
    const d = new Date(since);
    if (Number.isNaN(d.getTime())) return String(since);
    return d.toISOString();
  } catch {
    return String(since);
  }
}

export function AlertDetails({ alerts, runbookUrl, className = "" }: AlertDetailsProps) {
  if (!alerts.length) return null;

  return (
    <section
      className={`vpn-node-drilldown-panel vpn-node-alert-details ${className}`.trim()}
      role="region"
      aria-label="Alert details"
    >
      <h3 className="shead-label vpn-node-alert-details__title">
        Alerts
      </h3>
      <ul className="vpn-node-alert-details__list">
        {alerts.map((a, i) => (
          <li
            key={`${a.metric}-${i}`}
            className={`vpn-node-alert-details__item vpn-node-alert-details__item--${a.severity === "critical" ? "danger" : "warning"}`}
          >
            <div className="vpn-node-alert-details__row">
              <span className="vpn-node-alert-details__metric">{a.metric}</span>
              <span className="vpn-node-alert-details__value type-data-mono">{String(a.value)}</span>
            </div>
            {a.baseline != null && (
              <div className="vpn-node-alert-details__meta">
                Baseline: {dash(a.baseline)}
              </div>
            )}
            {a.since != null && (
              <div className="vpn-node-alert-details__meta">Since: {formatSince(a.since)}</div>
            )}
            {a.likely_cause != null && a.likely_cause !== "" && (
              <div className="vpn-node-alert-details__cause">{a.likely_cause}</div>
            )}
          </li>
        ))}
      </ul>
      {runbookUrl && (
        <a
          href={runbookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="vpn-node-alert-details__runbook type-meta"
        >
          Runbook
        </a>
      )}
    </section>
  );
}
