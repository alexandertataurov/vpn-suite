/**
 * Upsell engine types (UPSELL-ENGINE-SPEC §7).
 * Plan shape extended with optional metadata; backend may not ship all fields yet.
 */

export type UpgradeIntent =
  | "device_limit"
  | "expiry"
  | "trial_end"
  | "referral"
  | "annual_savings"
  | "family"
  | "premium_regions"
  | "speed"
  | "winback"
  | "addon";

export type UpsellOfferType =
  | "upgrade"
  | "renewal"
  | "addon"
  | "bundle"
  | "annual"
  | "trial_convert"
  | "winback";

export type UpsellUiVariant = "banner" | "card" | "modal" | "inline";

export interface UpsellDecision {
  show: boolean;
  trigger: UpgradeIntent;
  priority: number;
  targetTo: string | null;
  reason: string;
  offerType: UpsellOfferType;
  uiVariant: UpsellUiVariant;
  title: string;
  body: string;
  ctaLabel: string;
  targetPlanId?: string;
  targetAddonId?: string;
  suppressOtherTriggers?: UpgradeIntent[];
}

export interface UpsellHistoryEntry {
  trigger: UpgradeIntent;
  page: string;
  shownAt: string;
  clickedAt?: string;
  dismissedAt?: string;
  convertedAt?: string;
}

export type UpsellPage =
  | "home"
  | "plan"
  | "devices"
  | "referral"
  | "settings"
  | "checkout"
  | "header";

export type SubscriptionStatusForUpsell =
  | "none"
  | "trial"
  | "active"
  | "grace"
  | "expired"
  | "cancelled";

/** Plan with optional monetization metadata (Phase 2+). */
export interface PlanLikeForUpsell {
  id: string;
  name?: string;
  duration_days?: number;
  device_limit?: number;
  price_amount?: number;
  display_order?: number;
  upsell_methods?: string[];
  upgrade_rank?: number;
  solves_triggers?: string[];
  upsell_tags?: string[];
  recommended_upgrade_plan_id?: string | null;
  recommended_addon_id?: string | null;
}

export interface UpsellContext {
  page: UpsellPage;
  currentPlanId?: string | null;
  currentPlan?: PlanLikeForUpsell | null;
  plans: PlanLikeForUpsell[];
  subscriptionStatus: SubscriptionStatusForUpsell;
  daysToExpiry?: number | null;
  trialDaysLeft?: number | null;
  devicesUsed?: number | null;
  deviceLimit?: number | null;
  isDeviceLimitError?: boolean;
  isMonthly?: boolean;
  hasAnnualPlanAvailable?: boolean;
  hasDismissedTriggers?: Partial<Record<UpgradeIntent, boolean>>;
  recentUpsellHistory?: UpsellHistoryEntry[];
  sessionShownTriggers?: UpgradeIntent[];
  isAtHighestTier?: boolean;
  serverUsageSignals?: {
    manualRegionSwitches7d?: number;
    premiumRegionRequests7d?: number;
    reconnects7d?: number;
    slowSpeedReports7d?: number;
  };
}
