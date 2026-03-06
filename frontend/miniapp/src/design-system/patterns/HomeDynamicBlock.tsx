import {
  MissionAlert,
  MissionCard,
  MissionChip,
  MissionModuleHead,
  MissionSecondaryLink,
  type MissionAlertTone,
} from "./MissionPrimitives";

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
    tone: MissionAlertTone;
    title: string;
    message: string;
    action?: { label: string; to: string };
  }[] = [];

  if (healthError) {
    items.push({
      tone: "warning",
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
      tone: daysLeft <= 0 ? "error" : "warning",
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
      tone: atLimit ? "error" : "info",
      title: "Device capacity",
      message,
      action: { label: "Manage devices", to: "/devices" },
    });
  }

  if (items.length === 0) {
    return (
      <MissionCard as="div" tone="green" className="module-card">
        <MissionModuleHead
          label="Signals"
          chip={<MissionChip tone="green">Clear</MissionChip>}
        />
        <h3 className="op-name type-h3">All systems nominal</h3>
        <p className="op-desc type-body-sm">No critical alerts for your account.</p>
      </MissionCard>
    );
  }

  return (
    <MissionCard as="div" tone="amber" className="card-list module-card">
      {items.map((item) => (
        <div key={`${item.title}-${item.tone}`} className="card-list-item">
          <MissionAlert
            tone={item.tone}
            title={item.title}
            message={item.message}
            actions={item.action != null ? (
              <MissionSecondaryLink to={item.action.to}>
                {item.action.label}
              </MissionSecondaryLink>
            ) : undefined}
          />
        </div>
      ))}
    </MissionCard>
  );
}
