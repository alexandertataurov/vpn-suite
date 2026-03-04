import { Panel, Caption, Body } from "@/ui";

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

  return (
    <Panel
      className={`card instrument-card stagger-item ${status === "expired" ? "instrument-card--alert" : status === "active" ? "instrument-card--active" : "instrument-card--inactive"} subscription-summary-card subscription-summary-card--status-${status}`}
    >
      <Caption>Subscription</Caption>
      <Body>
        {status === "none" ? (
          "No active plan"
        ) : (
          <>
            Plan <span className="subscription-summary-plan-id">{planId}</span>
          </>
        )}
      </Body>
      {status !== "none" && (
        <Caption className={daysLeft <= 7 ? "subscription-summary-warning" : ""}>
          {daysLabel}
        </Caption>
      )}
      {deviceLimit != null && status === "active" && (
        <Caption tabular>
          Devices: <strong>{deviceCount}</strong> / <strong>{deviceLimit}</strong>
        </Caption>
      )}
    </Panel>
  );
}
