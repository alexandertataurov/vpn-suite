import { Link } from "react-router-dom";
import { InlineAlert } from "../ui";

export interface HomeDynamicBlockProps {
  daysLeft: number;
  hasSub: boolean;
  deviceLimit: number | null;
  usedDevices: number;
  healthError: boolean;
}

export function HomeDynamicBlock({
  daysLeft,
  hasSub,
  deviceLimit,
  usedDevices,
  healthError,
}: HomeDynamicBlockProps) {
  const items: {
    variant: "warning" | "error" | "info";
    title: string;
    message: string;
    action?: { label: string; to: string };
  }[] = [];

  if (healthError) {
    items.push({
      variant: "warning",
      title: "Service health",
      message: "Backend telemetry reports degradation. Connection may be unstable.",
    });
  }

  if (hasSub && daysLeft <= 7) {
    const message =
      daysLeft <= 0
        ? "Your plan expired. Renew now to restore secure traffic."
        : daysLeft === 1
          ? "Your plan ends tomorrow. Renew to avoid interruption."
          : `Your plan ends in ${daysLeft} days. Renew to avoid interruption.`;
    items.push({
      variant: daysLeft <= 0 ? "error" : "warning",
      title: "Subscription",
      message,
      action: { label: "Renew now", to: "/plan" },
    });
  }

  if (deviceLimit != null && usedDevices >= deviceLimit - 1) {
    const atLimit = usedDevices >= deviceLimit;
    const message = atLimit
      ? `Device capacity reached (${deviceLimit}). Revoke one profile before issuing another.`
      : `${deviceLimit - usedDevices} device slot${deviceLimit - usedDevices === 1 ? "" : "s"} remaining.`;
    items.push({
      variant: atLimit ? "error" : "info",
      title: "Device capacity",
      message,
      action: { label: "Manage devices", to: "/devices" },
    });
  }

  if (items.length === 0) {
    return (
      <div className="card edge eg status-ok">
        <p className="status-ok-title">All systems nominal</p>
        <p className="status-ok-note">No critical alerts for your account.</p>
      </div>
    );
  }

  return (
    <div className="card edge ea card-list">
      {items.map((item) => (
        <div key={`${item.title}-${item.variant}`} className="card-list-item">
          <InlineAlert
            variant={item.variant}
            title={item.title}
            message={item.message}
            actions={
              item.action != null ? (
                <Link to={item.action.to} className="type-body-sm link-interactive">
                  {item.action.label}
                </Link>
              ) : undefined
            }
          />
        </div>
      ))}
    </div>
  );
}
