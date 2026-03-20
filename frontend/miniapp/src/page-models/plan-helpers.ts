/**
 * Pure helpers for Plan page view-model construction.
 * Used by usePlanPageModel; no React/UI dependencies.
 * Re-exports for Plan page composition.
 */
import type { WebAppBillingHistoryItem, WebAppBillingHistoryStatus } from "@vpn-suite/shared";
import type { PlanItem } from "@/api";
import { formatDate } from "@/lib/utils/format";
import { translate } from "@/lib/i18n";

export const YEARLY_DURATION_THRESHOLD = 45;
export const LIFETIME_DURATION_THRESHOLD = 36500;
export const DEFAULT_USAGE_SOFT_CAP_BYTES = 20 * 1024 * 1024 * 1024;

export type UsageTone = "ok" | "warn" | "crit";

export interface TierFeature {
  id: string;
  icon: "yes" | "no" | "amber";
  /** i18n key (passed to `t()`). Use `textPlain` for pre-localized API-backed copy. */
  text?: string;
  /** Already-localized label (skips `t()`). */
  textPlain?: string;
  value?: string;
  valuePlain?: string;
}

export interface TierPair {
  key: string;
  label: string;
  description: string;
  monthly?: PlanItem;
  annual?: PlanItem;
  isCurrent: boolean;
  /** @deprecated Feature rows are derived in the plan grid from the selected billing period + plan. */
  features?: TierFeature[];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Use plan.name from backend as-is for display, falling back only when empty. */
export function sanitizePlanDisplayName(name: string, locale: "en" | "ru" = "en"): string {
  const s = (name ?? "").trim();
  if (s) return s;
  return translate(locale, "plan.fallback_plan_name");
}

export function normalizeTierKey(rawName: string): string {
  const name = rawName.trim().toLowerCase();
  if (name.includes("basic") || name.includes("standard")) return "basic";
  if (name.includes("pro")) return "pro";
  if (name.includes("team") || name.includes("family")) return "team";
  const slug = name.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "plan";
}

export function tierLabelForKey(key: string, fallbackName: string, locale: "en" | "ru" = "en"): string {
  if (key === "basic") return translate(locale, "plan.tier_basic_label");
  if (key === "pro") return translate(locale, "plan.tier_pro_label");
  if (key === "team") return translate(locale, "plan.tier_team_label");
  return fallbackName || translate(locale, "plan.fallback_plan_name");
}

export function tierDescriptionForKey(key: string, locale: "en" | "ru" = "en"): string {
  if (key === "basic") return translate(locale, "plan.tier_basic_description");
  if (key === "pro") return translate(locale, "plan.tier_pro_description");
  if (key === "team") return translate(locale, "plan.tier_team_description");
  return translate(locale, "plan.tier_default_description");
}

export function tierSortRank(key: string): number {
  if (key === "basic") return 0;
  if (key === "pro") return 1;
  if (key === "team") return 2;
  return 3;
}

/** Feature rows derived only from plan fields returned by GET /webapp/plans (no static tier matrix). */
export function featuresFromPlan(plan: PlanItem | undefined, locale: "en" | "ru"): TierFeature[] {
  if (!plan) {
    return [
      {
        id: "choose",
        icon: "yes",
        text: "plan.features_pick_duration_below",
      },
    ];
  }
  const dl = plan.device_limit ?? 1;
  const period = periodLabelForHeroLocalized(plan.duration_days, locale);
  const stars = formatStars(plan.price_amount);
  return [
    {
      id: "devices",
      icon: "yes",
      textPlain: translate(locale, "plan.feature_devices_included", { count: dl }),
    },
    {
      id: "billing",
      icon: "yes",
      textPlain: translate(locale, "plan.feature_billing_cycle", { period }),
    },
    {
      id: "price",
      icon: "yes",
      textPlain: translate(locale, "plan.feature_price_stars", { stars }),
    },
  ];
}

/** Plans come from API in display_order; we preserve that when grouping. */
export function buildTierPairs(
  plans: PlanItem[],
  currentPlanId: string | null,
  locale: "en" | "ru" = "en",
): TierPair[] {
  const grouped = new Map<string, TierPair>();
  const tierMinDisplayOrder = new Map<string, number>();

  for (const plan of plans) {
    const fallbackName = plan.name?.trim() || plan.id;
    const key = normalizeTierKey(fallbackName);
    const existing = grouped.get(key) ?? {
      key,
      label: tierLabelForKey(key, fallbackName, locale),
      description: tierDescriptionForKey(key, locale),
      monthly: undefined,
      annual: undefined,
      isCurrent: false,
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

export function periodLabelForHeroLocalized(durationDays: number, locale: "en" | "ru" = "en"): string {
  if (durationDays >= LIFETIME_DURATION_THRESHOLD) return translate(locale, "plan.period_lifetime");
  if (durationDays > YEARLY_DURATION_THRESHOLD) return translate(locale, "plan.period_annual");
  return translate(locale, "plan.period_monthly");
}

export function usageToneFromPercent(percent: number): UsageTone {
  if (percent >= 100) return "crit";
  if (percent >= 80) return "warn";
  return "ok";
}

export function historyStatusLabel(status: WebAppBillingHistoryStatus, locale: "en" | "ru" = "en"): string {
  if (status === "paid") return translate(locale, "plan.status_paid");
  if (status === "failed") return translate(locale, "plan.status_failed");
  if (status === "refunded") return translate(locale, "plan.status_refunded");
  return translate(locale, "plan.status_pending");
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
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return formatDate(date, "en-US");
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
}

export function buildNextStepCard(params: {
  isSubscribed: boolean;
  routeReason: string;
  recommendedRoute: string;
  locale?: "en" | "ru";
}): NextStepCardConfig | null {
  const { isSubscribed, routeReason, recommendedRoute, locale = "en" } = params;
  if (!isSubscribed) {
    return {
      title: translate(locale, "plan.next_step_title"),
      description: translate(locale, "plan.next_step_choose_plan_desc"),
      alertTone: "info",
      alertTitle: translate(locale, "plan.next_step_choose_plan_alert_title"),
      alertMessage: translate(locale, "plan.next_step_choose_plan_alert_body"),
      primaryLabel: translate(locale, "plan.next_step_choose_plan_primary"),
      primaryActionType: "scrollToPlans" as const,
      secondaryLabel: translate(locale, "plan.next_step_contact_support"),
      secondaryTo: "/support",
    };
  }
  if (routeReason === "no_device") {
    return {
      title: translate(locale, "plan.next_step_title"),
      description: translate(locale, "plan.next_step_manage_devices_desc"),
      alertTone: "warning",
      alertTitle: translate(locale, "plan.next_step_manage_devices_alert_title"),
      alertMessage: translate(locale, "plan.next_step_manage_devices_alert_body"),
      primaryLabel: translate(locale, "plan.next_step_manage_devices_primary"),
      primaryTo: recommendedRoute,
      secondaryLabel: translate(locale, "plan.next_step_contact_support"),
      secondaryTo: "/support",
    };
  }
  if (routeReason === "connection_not_confirmed") {
    return {
      title: translate(locale, "plan.next_step_title"),
      description: translate(locale, "plan.next_step_finish_setup_desc"),
      alertTone: "warning",
      alertTitle: translate(locale, "plan.next_step_finish_setup_alert_title"),
      alertMessage: translate(locale, "plan.next_step_finish_setup_alert_body"),
      primaryLabel: translate(locale, "plan.next_step_finish_setup_primary"),
      primaryTo: recommendedRoute,
      secondaryLabel: translate(locale, "plan.cta_manage_devices"),
      secondaryTo: "/devices",
    };
  }
  if (routeReason === "grace" || routeReason === "expired_with_grace") {
    return {
      title: translate(locale, "plan.next_step_access_title"),
      description: translate(locale, "plan.next_step_restore_access_desc"),
      alertTone: "warning",
      alertTitle: translate(locale, "plan.next_step_restore_access_alert_title"),
      alertMessage: translate(locale, "plan.next_step_restore_access_alert_body"),
      primaryLabel: translate(locale, "plan.next_step_restore_access_primary"),
      primaryTo: recommendedRoute,
      secondaryLabel: translate(locale, "plan.next_step_contact_support"),
      secondaryTo: "/support",
    };
  }
  if (routeReason === "paused_access") {
    return {
      title: translate(locale, "plan.next_step_access_title"),
      description: translate(locale, "plan.next_step_open_settings_desc_paused"),
      alertTone: "info",
      alertTitle: translate(locale, "plan.next_step_open_settings_alert_title_paused"),
      alertMessage: translate(locale, "plan.next_step_open_settings_alert_body_paused"),
      primaryLabel: translate(locale, "plan.next_step_open_settings_primary"),
      primaryTo: "/settings",
      secondaryLabel: translate(locale, "plan.next_step_contact_support"),
      secondaryTo: "/support",
    };
  }
  if (routeReason === "cancelled_at_period_end") {
    return {
      title: translate(locale, "plan.next_step_access_title"),
      description: translate(locale, "plan.next_step_open_settings_desc_cancelled"),
      alertTone: "info",
      alertTitle: translate(locale, "plan.next_step_open_settings_alert_title_cancelled"),
      alertMessage: translate(locale, "plan.next_step_open_settings_alert_body_cancelled"),
      primaryLabel: translate(locale, "plan.next_step_open_settings_primary"),
      primaryTo: "/settings",
      secondaryLabel: translate(locale, "plan.cta_manage_devices"),
      secondaryTo: "/devices",
    };
  }
  return null;
}

export function tierFeatureToRow(feature: TierFeature) {
  return {
    icon: feature.icon,
    text: feature.text,
    textPlain: feature.textPlain,
    value: feature.value,
    valuePlain: feature.valuePlain,
  } as const;
}

export function toBillingHistoryView(
  items: WebAppBillingHistoryItem[],
  formatStarsFn: (v: number) => string,
  locale: "en" | "ru" = "en",
): BillingHistoryViewItem[] {
  return items.map((item) => {
    const statusClass = historyStatusClass(item.status);
    const date = formatHistoryDate(item.created_at);
    const invoiceRef = compactInvoiceRef(item.invoice_ref ?? item.payment_id);
    const planName = sanitizePlanDisplayName(item.plan_name ?? "", locale);
    const title = item.status === "paid"
      ? translate(locale, "plan.payment_history_item_renewal", { plan: planName })
      : planName;
    return {
      id: item.payment_id,
      statusClass,
      title,
      subtitle: translate(locale, "plan.payment_history_item_subtitle", {
        date,
        invoice: invoiceRef,
      }),
      amount: formatStarsFn(item.amount),
      statusLabel: historyStatusLabel(item.status, locale),
      statusVariant: statusClass === "crit" ? "offline" : statusClass,
    };
  });
}
