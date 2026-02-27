import { Panel } from "@vpn-suite/shared/ui";

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
      className={`card subscription-summary-card subscription-summary-card--status-${status}`}
    >
      <p className="text-muted fs-sm mb-0">Subscription</p>
      <p className="mt-xs mb-0">
        {status === "none" ? (
          "No active plan"
        ) : (
          <>
            Plan <span className="text-primary">{planId}</span>
          </>
        )}
      </p>
      {status !== "none" && (
        <p className={`fs-sm mt-xs mb-0 ${daysLeft <= 7 ? "text-warning" : ""}`}>
          {daysLabel}
        </p>
      )}
      {deviceLimit != null && status === "active" && (
        <p className="fs-sm mt-xs mb-0">
          Devices: <strong>{deviceCount}</strong> / <strong>{deviceLimit}</strong>
        </p>
      )}
    </Panel>
  );
}
