import { Panel } from "../ui";

export interface HomeHeroPanelProps {
  connected: boolean;
  locationLabel: string;
  planId: string;
  daysLeft: number;
  subStatus: "active" | "expired" | "none";
  deviceCount: number;
  deviceLimit: number | null;
}

export function HomeHeroPanel({
  connected,
  locationLabel,
  planId,
  daysLeft,
  subStatus,
  deviceCount,
  deviceLimit,
}: HomeHeroPanelProps) {
  const primaryValue = connected ? "CONNECTED" : "OFFLINE";

  let subLine: string;
  if (connected) {
    subLine = `Gateway: ${locationLabel}`;
  } else if (subStatus === "none") {
    subLine = "No active subscription";
  } else if (subStatus === "expired") {
    subLine = "Subscription expired";
  } else {
    const daysLabel =
      daysLeft <= 0
        ? "Expires today"
        : daysLeft === 1
          ? "1 day left"
          : `${daysLeft} days left`;
    subLine = `${daysLabel}`;
  }

  const edgeClass = connected ? "eg" : "er";
  const chipVariant = connected ? "cg" : "cr";

  return (
    <Panel variant="surface" className={`card edge kpi stagger-item ${edgeClass}`}>
      <div className="kpi-top">
        <span className="kpi-label">Network State</span>
        <span className={`chip ${chipVariant}`}>{connected ? "Connected" : "Offline"}</span>
      </div>
      <div className="kv">{primaryValue}</div>
      <p className="kpi-subline">{subLine}</p>

      <div className="metric-strip">
        <div className="metric">
          <span className="metric-label">Plan</span>
          <span className="metric-value data-truncate">{subStatus === "none" ? "None" : planId}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Expires</span>
          <span className="metric-value miniapp-tnum">
            {subStatus === "none" ? "-" : daysLeft <= 0 ? "Today" : `${daysLeft}d`}
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">Devices</span>
          <span className="metric-value miniapp-tnum">
            {deviceLimit == null ? `${deviceCount}` : `${deviceCount}/${deviceLimit}`}
          </span>
        </div>
      </div>
    </Panel>
  );
}
