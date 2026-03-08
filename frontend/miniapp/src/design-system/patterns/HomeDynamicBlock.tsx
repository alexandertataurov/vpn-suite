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
  /** When false, renewal message is shown without "Renew now" action. Default true (legacy). */
  showUpsellExpiry?: boolean;
  /** When true and at device limit, show "Upgrade plan" instead of "Manage devices". Default false. */
  showUpsellDeviceLimit?: boolean;
  /** Route used for renewal/trial-end upsell. */
  renewalTargetTo?: string;
  /** Route used for upgrade upsell (trial end, etc.). */
  upgradeTargetTo?: string;
  /** Route for device-limit upsell (plan with more devices). Falls back to upgradeTargetTo if unset. */
  upgradeTargetToDeviceLimit?: string;
  /** When true, subscription is a trial (trial_end upsell may apply). */
  isTrial?: boolean;
  /** Days until trial ends; used with showUpsellTrialEnd. */
  trialDaysLeft?: number;
  /** When true and trial ending soon, show "Upgrade" CTA. */
  showUpsellTrialEnd?: boolean;
}

const TRIAL_ENDING_DAYS = 7;

export function HomeDynamicBlock({
  daysLeft,
  hasSub,
  deviceLimit,
  usedDevices,
  healthError,
  showUpsellExpiry = true,
  showUpsellDeviceLimit = false,
  renewalTargetTo = "/plan",
  upgradeTargetTo = "/plan",
  upgradeTargetToDeviceLimit,
  isTrial = false,
  trialDaysLeft = 0,
  showUpsellTrialEnd = false,
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
      message: "Service telemetry reports degradation. Connection may be unstable.",
    });
  }

  if (hasSub && isTrial && trialDaysLeft <= TRIAL_ENDING_DAYS) {
    const message =
      trialDaysLeft <= 0
        ? "Your trial ended. Upgrade to keep secure access."
        : trialDaysLeft === 1
          ? "Your trial ends tomorrow. Upgrade to keep access."
          : `Your trial ends in ${trialDaysLeft} days. Upgrade to keep access.`;
    items.push({
      tone: trialDaysLeft <= 0 ? "error" : "warning",
      title: "Trial",
      message,
      ...(showUpsellTrialEnd ? { action: { label: "Upgrade", to: upgradeTargetTo } } : {}),
    });
  } else if (hasSub && daysLeft <= 7) {
    const message =
      daysLeft <= 0
        ? "Your plan expired. Renew to restore secure traffic."
        : daysLeft === 1
          ? "Your plan ends tomorrow. Renew to avoid interruption."
          : `Your plan ends in ${daysLeft} days. Renew to avoid interruption.`;
    items.push({
      tone: daysLeft <= 0 ? "error" : "warning",
      title: "Subscription",
      message,
      ...(showUpsellExpiry ? { action: { label: "Renew now", to: renewalTargetTo } } : {}),
    });
  }

  if (deviceLimit != null && usedDevices >= deviceLimit - 1) {
    const atLimit = usedDevices >= deviceLimit;
    const message = atLimit
      ? `Device capacity reached (${deviceLimit}). ${showUpsellDeviceLimit ? "Upgrade your plan for more devices." : "Revoke one profile before issuing another."}`
      : `${deviceLimit - usedDevices} device slot${deviceLimit - usedDevices === 1 ? "" : "s"} remaining.`;
    items.push({
      tone: atLimit ? "error" : "info",
      title: "Device capacity",
      message,
      action: atLimit && showUpsellDeviceLimit
        ? { label: "Upgrade plan", to: upgradeTargetToDeviceLimit ?? upgradeTargetTo }
        : { label: "Manage devices", to: "/devices" },
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
        <p className="op-desc type-body-sm">No account alerts need action.</p>
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
