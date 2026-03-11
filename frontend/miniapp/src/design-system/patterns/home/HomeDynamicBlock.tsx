import {
  MissionAlert,
  MissionCard,
  MissionModuleHead,
  MissionPrimaryLink,
  MissionSecondaryLink,
  type MissionAlertTone,
} from "../mission/Mission";

export type HomeSignalSeverity = "info" | "warning" | "critical";

export interface HomeDynamicBlockProps {
  daysLeft: number;
  hasSub: boolean;
  deviceLimit: number | null;
  usedDevices: number;
  healthError: boolean;
  bandwidthRemainingPercent?: number | null;
  severity?: HomeSignalSeverity;
  maxVisible?: number;
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
const CRITICAL_DAYS = 1;

function signalToneFromSeverity(severity: HomeSignalSeverity): MissionAlertTone {
  if (severity === "critical") return "error";
  if (severity === "warning") return "warning";
  return "info";
}

function severityForDaysLeft(daysLeft: number): HomeSignalSeverity {
  if (daysLeft <= CRITICAL_DAYS) return "critical";
  if (daysLeft <= TRIAL_ENDING_DAYS) return "warning";
  return "info";
}

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function HomeDynamicBlock({
  daysLeft,
  hasSub,
  deviceLimit,
  usedDevices,
  healthError,
  bandwidthRemainingPercent = null,
  severity,
  maxVisible = 2,
  showUpsellExpiry = true,
  showUpsellDeviceLimit = false,
  renewalTargetTo = "/plan",
  upgradeTargetTo = "/plan",
  upgradeTargetToDeviceLimit,
  isTrial = false,
  trialDaysLeft = 0,
  showUpsellTrialEnd = false,
}: HomeDynamicBlockProps) {
  const items: Array<{
    kind: "plan_expired" | "plan_expiring" | "device_limit" | "bandwidth_low" | "trial_active" | "service_health";
    priority: number;
    tone: MissionAlertTone;
    severity: HomeSignalSeverity;
    title: string;
    message: string;
    action?: { label: string; to: string };
  }> = [];

  if (healthError) {
    const itemSeverity = severity ?? "warning";
    items.push({
      kind: "service_health",
      priority: 4,
      tone: signalToneFromSeverity(itemSeverity),
      severity: itemSeverity,
      title: "Service health",
      message: "Service telemetry reports degradation. Connection may be unstable.",
    });
  }

  if (hasSub && isTrial) {
    const message =
      trialDaysLeft <= 0
        ? "Your trial ended. Choose a paid plan to keep access."
        : trialDaysLeft === 1
          ? "Your trial ends tomorrow. Upgrade to keep access."
          : trialDaysLeft > 0
            ? `Trial active. ${trialDaysLeft} days remain before upgrade is required.`
            : "Trial active. Upgrade to keep access.";
    const itemSeverity = severity ?? (trialDaysLeft <= TRIAL_ENDING_DAYS ? severityForDaysLeft(trialDaysLeft) : "info");
    items.push({
      kind: "trial_active",
      priority: 5,
      tone: signalToneFromSeverity(itemSeverity),
      severity: itemSeverity,
      title: "Trial",
      message,
      ...(showUpsellTrialEnd ? { action: { label: "Upgrade", to: upgradeTargetTo } } : {}),
    });
  } else if (hasSub && daysLeft <= 3) {
    const message =
      daysLeft <= 0
        ? "Your plan expired. Renew to restore access."
        : daysLeft === 1
        ? "Your plan ends tomorrow. Renew to avoid interruption."
        : `Your plan ends in ${daysLeft} days. Renew to avoid interruption.`;
    const itemSeverity = severity ?? severityForDaysLeft(daysLeft);
    items.push({
      kind: daysLeft <= 0 ? "plan_expired" : "plan_expiring",
      priority: daysLeft <= 0 ? 1 : 2,
      tone: signalToneFromSeverity(itemSeverity),
      severity: itemSeverity,
      title: "Subscription",
      message,
      ...(showUpsellExpiry ? { action: { label: "Renew now", to: renewalTargetTo } } : {}),
    });
  }

  if (deviceLimit != null && usedDevices >= deviceLimit) {
    const itemSeverity = severity ?? "critical";
    items.push({
      kind: "device_limit",
      priority: 3,
      tone: signalToneFromSeverity(itemSeverity),
      severity: itemSeverity,
      title: "Device capacity",
      message: `Device capacity reached (${deviceLimit}). ${showUpsellDeviceLimit ? "Upgrade your plan for more devices." : "Revoke one profile before issuing another."}`,
      action: showUpsellDeviceLimit
        ? { label: "Upgrade plan", to: upgradeTargetToDeviceLimit ?? upgradeTargetTo }
        : { label: "Manage devices", to: "/devices" },
    });
  }

  if (bandwidthRemainingPercent != null && bandwidthRemainingPercent <= 10) {
    const itemSeverity = severity ?? (bandwidthRemainingPercent <= 3 ? "critical" : "warning");
    items.push({
      kind: "bandwidth_low",
      priority: 4,
      tone: signalToneFromSeverity(itemSeverity),
      severity: itemSeverity,
      title: "Bandwidth reserve",
      message: `${bandwidthRemainingPercent}% of your current period bandwidth remains. Reduce usage or upgrade before service quality degrades.`,
      action: { label: "View usage", to: "/plan" },
    });
  }

  const visibleItems = [...items]
    .sort((left, right) => left.priority - right.priority)
    .slice(0, maxVisible);

  if (visibleItems.length === 0) {
    return (
      <MissionCard as="div" tone="blue" className="module-card home-signal-card home-signal-card--clear">
        <MissionModuleHead label="Signals" />
        <h3 className="op-name type-h3">No account issues</h3>
        <p className="op-desc type-body-sm">Nothing needs action right now.</p>
      </MissionCard>
    );
  }

  const highestSeverity = visibleItems.some((item) => item.severity === "critical")
    ? "critical"
    : visibleItems.some((item) => item.severity === "warning")
      ? "warning"
      : "info";
  const cardTone = highestSeverity === "critical" ? "red" : highestSeverity === "warning" ? "amber" : "blue";

  return (
    <MissionCard as="div" tone={cardTone} className={joinClasses("card-list", "module-card", "home-signal-card", `home-signal-card--${highestSeverity}`)}>
      {visibleItems.map((item) => (
        <div key={`${item.title}-${item.tone}`} className="card-list-item">
          <MissionAlert
            tone={item.tone}
            className={joinClasses("home-signal-alert", `home-signal-alert--${item.severity}`)}
            title={(
              <span className="home-signal-title">
                {item.severity === "critical" ? <span className="home-signal-pulse" aria-hidden /> : null}
                <span>{item.title}</span>
              </span>
            )}
            message={item.message}
            actions={item.action != null ? (
              item.severity === "critical" ? (
                <MissionPrimaryLink to={item.action.to} className="home-signal-action home-signal-action--critical">
                  {item.action.label}
                </MissionPrimaryLink>
              ) : (
                <MissionSecondaryLink to={item.action.to} className="home-signal-action">
                  {item.action.label}
                </MissionSecondaryLink>
              )
            ) : undefined}
          />
        </div>
      ))}
    </MissionCard>
  );
}
