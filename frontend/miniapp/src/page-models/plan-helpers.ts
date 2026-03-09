/**
 * Pure helpers for Plan page view-model construction.
 * Used by usePlanPageModel; no React/UI dependencies.
 * Re-exports for Plan page composition.
 */
import type { WebAppBillingHistoryItem, WebAppBillingHistoryStatus } from "@vpn-suite/shared";
import type { PlanItem } from "@/api";

export const YEARLY_DURATION_THRESHOLD = 45;
export const LIFETIME_DURATION_THRESHOLD = 36500;
export const DEFAULT_USAGE_SOFT_CAP_BYTES = 20 * 1024 * 1024 * 1024;

export type UsageTone = "ok" | "warn" | "crit";

export interface TierFeature {
  id: string;
  icon: "yes" | "no" | "amber";
  text: string;
  value?: string;
}

export interface TierPair {
  key: string;
  label: string;
  description: string;
  monthly?: PlanItem;
  annual?: PlanItem;
  isCurrent: boolean;
  features: TierFeature[];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Strip Beta/developer prefixes for billing UI display. Keeps backend plan.name unchanged. */
export function sanitizePlanDisplayName(name: string): string {
  const s = (name ?? "").trim();
  if (!s) return "Plan";
  const stripped = s
    .replace(/^beta\s*[–-]\s*/i, "")
    .replace(/^beta\s+/i, "")
    .replace(/^beta$/i, "")
    .trim();
  const periodWords = /^(annual|monthly|lifetime)$/i;
  if (!stripped || periodWords.test(stripped)) return "Pro";
  return stripped;
}

export function normalizeTierKey(rawName: string): string {
  const name = rawName.trim().toLowerCase();
  if (name.includes("basic") || name.includes("standard")) return "basic";
  if (name.includes("pro")) return "pro";
  if (name.includes("team") || name.includes("family")) return "team";
  const slug = name.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "plan";
}

export function tierLabelForKey(key: string, fallbackName: string): string {
  if (key === "basic") return "Basic";
  if (key === "pro") return "Pro";
  if (key === "team") return "Team";
  return fallbackName || "Plan";
}

export function tierDescriptionForKey(key: string): string {
  if (key === "basic") return "Personal use · 1 device";
  if (key === "pro") return "Power users · 3 devices";
  if (key === "team") return "Shared access · multi-device";
  return "Secure VPN access";
}

export function tierSortRank(key: string): number {
  if (key === "basic") return 0;
  if (key === "pro") return 1;
  if (key === "team") return 2;
  return 3;
}

export function featuresForTier(key: string): TierFeature[] {
  if (key === "basic") {
    return [
      { id: "devices", icon: "yes", text: "Connected devices", value: "1 slot" },
      { id: "network", icon: "yes", text: "AmneziaWG protocol", value: "AWG" },
      { id: "killswitch", icon: "no", text: "Kill switch" },
    ];
  }
  if (key === "pro") {
    return [
      { id: "devices", icon: "yes", text: "Connected devices", value: "3 slots" },
      { id: "network", icon: "yes", text: "AmneziaWG protocol", value: "AWG" },
      { id: "support", icon: "amber", text: "Priority support", value: "Fast lane" },
    ];
  }
  if (key === "team") {
    return [
      { id: "devices", icon: "yes", text: "Connected devices", value: "10 slots" },
      { id: "network", icon: "yes", text: "AmneziaWG protocol", value: "AWG" },
      { id: "support", icon: "amber", text: "Shared workspace", value: "Team" },
    ];
  }
  return [
    { id: "devices", icon: "yes", text: "Connected devices", value: "Flexible" },
    { id: "network", icon: "yes", text: "AmneziaWG protocol", value: "AWG" },
  ];
}

/** Plans come from API in display_order; we preserve that when grouping. */
export function buildTierPairs(plans: PlanItem[], currentPlanId: string | null): TierPair[] {
  const grouped = new Map<string, TierPair>();
  const tierMinDisplayOrder = new Map<string, number>();

  for (const plan of plans) {
    const fallbackName = plan.name?.trim() || plan.id;
    const key = normalizeTierKey(fallbackName);
    const existing = grouped.get(key) ?? {
      key,
      label: tierLabelForKey(key, fallbackName),
      description: tierDescriptionForKey(key),
      monthly: undefined,
      annual: undefined,
      isCurrent: false,
      features: featuresForTier(key),
    };

    if (plan.duration_days > YEARLY_DURATION_THRESHOLD) {
      if (!existing.annual || plan.duration_days > existing.annual.duration_days) {
        existing.annual = plan;
      }
    } else if (!existing.monthly || plan.duration_days < existing.monthly.duration_days) {
      existing.monthly = plan;
    }

    if (plan.id === currentPlanId) {
      existing.isCurrent = true;
    }

    grouped.set(key, existing);
    const order = plan.display_order ?? 999_999;
    const prev = tierMinDisplayOrder.get(key);
    tierMinDisplayOrder.set(key, prev == null ? order : Math.min(prev, order));
  }

  return Array.from(grouped.values()).sort((a, b) => {
    const orderA = tierMinDisplayOrder.get(a.key) ?? 999_999;
    const orderB = tierMinDisplayOrder.get(b.key) ?? 999_999;
    if (orderA !== orderB) return orderA - orderB;
    const rankDelta = tierSortRank(a.key) - tierSortRank(b.key);
    if (rankDelta !== 0) return rankDelta;
    return a.label.localeCompare(b.label);
  });
}

export function formatStars(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `⭐${Math.max(0, Math.round(safe))}`;
}

export function periodLabelForHero(durationDays: number): string {
  if (durationDays >= LIFETIME_DURATION_THRESHOLD) return "Lifetime";
  if (durationDays > YEARLY_DURATION_THRESHOLD) return "Annual";
  return "Monthly";
}

export function usageToneFromPercent(percent: number): UsageTone {
  if (percent >= 100) return "crit";
  if (percent >= 80) return "warn";
  return "ok";
}

export function historyStatusLabel(status: WebAppBillingHistoryStatus): string {
  if (status === "paid") return "Paid";
  if (status === "failed") return "Failed";
  if (status === "refunded") return "Refunded";
  return "Pending";
}

export function historyStatusClass(status: WebAppBillingHistoryStatus): "paid" | "pend" | "crit" {
  if (status === "paid") return "paid";
  if (status === "failed") return "crit";
  return "pend";
}

export function compactInvoiceRef(ref: string): string {
  const compact = ref.replace(/^webapp:telegram_stars:/, "INV-");
  return compact.length > 18 ? `${compact.slice(0, 18)}…` : compact;
}

export function formatHistoryDate(iso: string): string {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return "—";
  return value.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** statusVariant matches StatusChipVariant: "active" | "paid" | "info" | "pend" | "offline". */
export interface BillingHistoryViewItem {
  id: string;
  statusClass: "paid" | "pend" | "crit";
  title: string;
  subtitle: string;
  amount: string;
  statusLabel: string;
  statusVariant: "paid" | "pend" | "offline";
}

export interface NextStepCardConfig {
  title: string;
  description: string;
  alertTone: "info" | "warning" | "success";
  alertTitle: string;
  alertMessage: string;
  primaryLabel: string;
  primaryTo?: string;
  /** When "scrollToPlans", page supplies scrollToPlans() for primaryAction. */
  primaryActionType?: "scrollToPlans";
  secondaryLabel?: string;
  secondaryTo?: string;
  badgeTone: "blue" | "amber" | "green" | "neutral";
  badgeLabel: string;
}

export function buildNextStepCard(params: {
  isSubscribed: boolean;
  routeReason: string;
  recommendedRoute: string;
}): NextStepCardConfig | null {
  const { isSubscribed, routeReason, recommendedRoute } = params;
  if (!isSubscribed) {
    return {
      title: "Setup",
      description: "Choose a plan first, then continue device setup in the next step.",
      alertTone: "info",
      alertTitle: "No active subscription",
      alertMessage: "Your account is signed in, but access starts only after plan activation.",
      primaryLabel: "Compare plans",
      primaryActionType: "scrollToPlans" as const,
      secondaryLabel: "Open support",
      secondaryTo: "/support",
      badgeTone: "blue",
      badgeLabel: "Step 1",
    };
  }
  if (routeReason === "no_device") {
    return {
      title: "Setup",
      description: "Billing is active. The next step is issuing your first device.",
      alertTone: "warning",
      alertTitle: "Setup is not complete",
      alertMessage: "You still need a device config before you can connect.",
      primaryLabel: "Open device setup",
      primaryTo: recommendedRoute,
      secondaryLabel: "Open support",
      secondaryTo: "/support",
      badgeTone: "amber",
      badgeLabel: "Step 2",
    };
  }
  if (routeReason === "connection_not_confirmed") {
    return {
      title: "Setup",
      description: "A device exists, but the connection is not confirmed yet.",
      alertTone: "warning",
      alertTitle: "Connection pending",
      alertMessage: "Finish the connection check so the app can move you to the active dashboard flow.",
      primaryLabel: "Continue setup",
      primaryTo: recommendedRoute,
      secondaryLabel: "Open devices",
      secondaryTo: "/devices",
      badgeTone: "amber",
      badgeLabel: "Step 3",
    };
  }
  if (routeReason === "grace" || routeReason === "expired_with_grace") {
    return {
      title: "Access state",
      description: "Your plan is outside the normal active state, but grace access is still available.",
      alertTone: "warning",
      alertTitle: "Grace period active",
      alertMessage: "Restore billing before grace ends to avoid losing access.",
      primaryLabel: "Restore access",
      primaryTo: recommendedRoute,
      secondaryLabel: "View support",
      secondaryTo: "/support",
      badgeTone: "amber",
      badgeLabel: "Grace",
    };
  }
  if (routeReason === "cancelled_at_period_end") {
    return {
      title: "Access state",
      description: "Your subscription is still active, but it is set to stop at the period end.",
      alertTone: "info",
      alertTitle: "Access remains active",
      alertMessage: "Review billing settings if you want to keep renewal turned on.",
      primaryLabel: "Open settings",
      primaryTo: "/settings",
      secondaryLabel: "Open devices",
      secondaryTo: "/devices",
      badgeTone: "blue",
      badgeLabel: "Scheduled",
    };
  }
  return null;
}

export function tierFeatureToRow(feature: TierFeature) {
  return {
    icon: feature.icon,
    text: feature.text,
    value: feature.value,
  } as const;
}

export function toBillingHistoryView(
  items: WebAppBillingHistoryItem[],
  formatStarsFn: (v: number) => string,
): BillingHistoryViewItem[] {
  return items.map((item) => {
    const statusClass = historyStatusClass(item.status);
    const date = formatHistoryDate(item.created_at);
    const invoiceRef = compactInvoiceRef(item.invoice_ref ?? item.payment_id);
    return {
      id: item.payment_id,
      statusClass,
      title: sanitizePlanDisplayName(item.plan_name ?? ""),
      subtitle: `${date} · Invoice ${invoiceRef}`,
      amount: formatStarsFn(item.amount),
      statusLabel: historyStatusLabel(item.status),
      statusVariant: statusClass === "crit" ? "offline" : statusClass,
    };
  });
}
