import { Panel } from "@/ui";

export interface SubscriptionSummaryCardProps {
  planId: string;
  daysLeft: number;
  status: "active" | "expired" | "none";
  deviceCount?: number;
  deviceLimit?: number | null;
}

export function SubscriptionSummaryCard({
  planId,
  daysLeft,
  status,
  deviceCount = 0,
  deviceLimit = null,
}: SubscriptionSummaryCardProps) {
  const daysLabel =
    status === "expired"
      ? "Expired"
      : status === "none"
        ? "No plan"
        : daysLeft <= 0
          ? "Expires today"
          : daysLeft === 1
            ? "1 day left"
            : `${daysLeft} days left`;

  const edgeClass = status === "expired" ? "er" : status === "active" ? "eg" : "et";
  const stateChipClass = status === "expired" ? "cr" : status === "active" ? "cg" : "cn";

  return (
    <Panel variant="surface" className={`card edge kpi stagger-item ${edgeClass}`}>
      <div className="kpi-top">
        <span className="kpi-label">Current Subscription</span>
        <span className={`chip ${stateChipClass}`}>{daysLabel}</span>
      </div>

      <div className="kv kv--sm">{status === "none" ? "Inactive" : `Plan ${planId}`}</div>

      <div className="metric-strip">
        <div className="metric">
          <span className="metric-label">Status</span>
          <span className="metric-value">{status.toUpperCase()}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Remaining</span>
          <span className="metric-value miniapp-tnum">{status === "none" ? "-" : `${Math.max(daysLeft, 0)}d`}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Devices</span>
          <span className="metric-value miniapp-tnum">
            {deviceLimit == null || status !== "active" ? `${deviceCount}` : `${deviceCount}/${deviceLimit}`}
          </span>
        </div>
      </div>
    </Panel>
  );
}
