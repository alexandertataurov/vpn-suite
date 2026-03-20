import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { WebAppBillingHistoryResponse } from "@vpn-suite/shared";
import { getPlans } from "@/api";
import { useWebappToken, webappApi } from "@/api/client";
import { useSession, useTelemetry, useTrackScreen } from "@/hooks";
import { webappQueryKeys } from "@/lib";
import { useI18n } from "@/hooks";
import { formatDate } from "@/lib/utils/format";
import type { PlanItem, PlansResponse } from "@/api";
import type { StandardPageHeader, StandardPageState } from "./types";
import {
  daysUntil,
  getActiveSubscription,
  getPrimarySubscription,
  getRenewalCheckoutPath,
  getUpgradeCheckoutPath,
  shouldShowUpsell,
} from "./helpers";
import {
  buildTierPairs,
  buildNextStepCard,
  tierSortRank,
  formatStars,
  periodLabelForHeroLocalized,
  planItemForBillingPeriod,
  sanitizePlanDisplayName,
  toBillingHistoryView,
  clamp,
  LIFETIME_DURATION_THRESHOLD,
} from "./plan-helpers";

export type SubscriptionState = "active" | "expiring" | "expired";
export type { PlanItem, PlansResponse };
export type PlanStyle = "normal" | "popular" | "promotional";
export type BillingPeriod = "monthly" | "annual";
export type RecommendedRouteReason =
  | "no_subscription"
  | "expired_with_grace"
  | "grace"
  | "paused_access"
  | "cancelled_at_period_end"
  | "no_device"
  | "connection_not_confirmed"
  | "connected_user"
  | "unknown";

export function usePlanPageModel(billingPeriod: BillingPeriod) {
  const hasToken = !!useWebappToken();
  const queryClient = useQueryClient();
  const sessionQuery = useSession(hasToken);
  const { t, locale } = useI18n();
  const plansQuery = useQuery({
    queryKey: [...webappQueryKeys.plans()],
    queryFn: getPlans,
    enabled: hasToken,
  });
  const historyQuery = useQuery<WebAppBillingHistoryResponse>({
    queryKey: [...webappQueryKeys.paymentsHistory(8)],
    queryFn: () => webappApi.get<WebAppBillingHistoryResponse>("/webapp/payments/history?limit=8&offset=0"),
    enabled: hasToken,
  });

  const plans = useMemo(() => plansQuery.data?.items ?? [], [plansQuery.data?.items]);
  const activeSub = getActiveSubscription(sessionQuery.data);
  const primarySub = getPrimarySubscription(sessionQuery.data);
  const recommendedRoute = sessionQuery.data?.routing?.recommended_route ?? "/plan";
  const routeReason = (sessionQuery.data?.routing?.reason ?? "unknown") as RecommendedRouteReason;
  const currentPlan = useMemo(
    () => (primarySub?.plan_id ? plans.find((p) => p.id === primarySub.plan_id) : undefined),
    [plans, primarySub?.plan_id],
  );
  const showUpsellExpiry = shouldShowUpsell(currentPlan?.upsell_methods, "expiry");
  const trialDaysLeft = daysUntil(primarySub?.trial_ends_at);
  const showUpsellTrialEnd =
    Boolean(primarySub?.is_trial) &&
    trialDaysLeft <= 30 &&
    shouldShowUpsell(currentPlan?.upsell_methods, "trial_end");
  const renewalTargetTo = currentPlan != null
    ? getRenewalCheckoutPath(currentPlan.id)
    : getUpgradeCheckoutPath(plans, primarySub?.plan_id);
  const upgradeTargetTo = getUpgradeCheckoutPath(plans, primarySub?.plan_id);
  const isSubscribed = activeSub != null;
  const daysLeft = daysUntil(primarySub?.valid_until);
  const subscriptionState: SubscriptionState = !primarySub || daysLeft <= 0
    ? "expired"
    : daysLeft <= 30
      ? "expiring"
      : "active";
  /** Renew (same-plan) only when: no auto_renew OR plan ends soon. Otherwise only upgrade. */
  const canShowRenew =
    primarySub?.auto_renew === false ||
    subscriptionState === "expiring" ||
    subscriptionState === "expired";

  useTrackScreen("plan", primarySub?.plan_id ?? null);
  const telemetry = useTelemetry(primarySub?.plan_id ?? null);

  const planMap = useMemo(() => new Map(plans.map((p) => [p.id, p])), [plans]);
  const heroPlan = primarySub ? planMap.get(primarySub.plan_id) : undefined;
  const tierPairs = useMemo(
    () => buildTierPairs(plans, primarySub?.plan_id ?? null, locale),
    [plans, primarySub?.plan_id, locale],
  );
  const hasAnnualOptions = tierPairs.some((tier) => tier.annual != null);
  const currentTier = tierPairs.find((tier) => tier.isCurrent) ?? null;
  const currentTierRank = currentTier ? tierSortRank(currentTier.key) : -1;
  const daysLeftForVisibility = primarySub?.valid_until
    ? Math.max(0, Math.ceil((new Date(primarySub.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
  const showCurrentTierForRenewal = isSubscribed && primarySub != null && daysLeftForVisibility <= 30;
  const visibleTierPairs = useMemo(() => {
    if (!isSubscribed) return tierPairs;
    if (showCurrentTierForRenewal) return tierPairs;
    return tierPairs.filter((tier) => tierSortRank(tier.key) > currentTierRank);
  }, [currentTierRank, isSubscribed, showCurrentTierForRenewal, tierPairs]);
  const shouldShowPlanOptions = !isSubscribed || showCurrentTierForRenewal || visibleTierPairs.length > 0;

  const selectedTierPlan = visibleTierPairs[0]
    ? planItemForBillingPeriod(visibleTierPairs[0], billingPeriod)
    : undefined;

  const activeDeviceCount =
    sessionQuery.data?.devices?.filter((d: { revoked_at?: string | null }) => !d.revoked_at).length ?? 0;
  const planDeviceLimit = currentPlan?.device_limit ?? heroPlan?.device_limit ?? null;
  const deviceLimit = planDeviceLimit ?? primarySub?.device_limit ?? 0;
  const heroDurationDays = heroPlan?.duration_days ?? selectedTierPlan?.duration_days ?? 30;
  const isLifetimePlan =
    !!heroPlan &&
    (heroPlan.duration_days >= LIFETIME_DURATION_THRESHOLD ||
      /lifetime/i.test(heroPlan.name ?? ""));
  const expiryPercent = isLifetimePlan
    ? 99.9
    : subscriptionState === "expired"
      ? 0
      : clamp((daysLeft / Math.max(heroDurationDays, 1)) * 100, 0, 100);

  const billingHistoryItems = useMemo(
    () => toBillingHistoryView(historyQuery.data?.items ?? [], formatStars, locale),
    [historyQuery.data?.items, locale],
  );

  const nextStepCard = useMemo(
    () =>
      buildNextStepCard({
        isSubscribed,
        routeReason,
        recommendedRoute,
        locale,
      }),
    [isSubscribed, routeReason, recommendedRoute, locale],
  );

  const heroPlanId = primarySub?.plan_id ?? selectedTierPlan?.id ?? null;
  const atDeviceLimit = deviceLimit > 0 && activeDeviceCount >= deviceLimit;
  const heroView = useMemo(
    () => ({
      heroPlanName: sanitizePlanDisplayName(
        heroPlan?.name?.trim() ?? primarySub?.plan_id ?? t("plan.no_active_plan_label"),
        locale,
      ),
      heroPlanPeriod: periodLabelForHeroLocalized(heroDurationDays, locale),
      heroStars: heroPlan?.price_amount ?? selectedTierPlan?.price_amount ?? 0,
      heroPeriodDetail: (() => {
        const days = heroPlan?.duration_days ?? selectedTierPlan?.duration_days;
        return days != null ? t("plan.hero_period_for_days", { days }) : "";
      })(),
      expiryText: primarySub?.valid_until
        ? formatDate(primarySub.valid_until, "en-US")
        : t("plan.no_active_subscription"),
      expiryPercent,
      expiryFillClass: (subscriptionState === "expired"
        ? "crit"
        : subscriptionState === "expiring"
          ? "warn"
          : "ok") as "ok" | "warn" | "crit",
      compactPlanId: heroPlanId ? `${heroPlanId.slice(0, 8)}···` : "--",
      heroPlanId,
      devicesLabel:
        deviceLimit > 0
          ? t("plan.devices_label_limited", { used: activeDeviceCount, limit: deviceLimit })
          : t("plan.devices_label_unbounded", { used: activeDeviceCount }),
      renewLabel:
        subscriptionState === "expiring" || subscriptionState === "expired"
          ? showUpsellExpiry || showUpsellTrialEnd
            ? t("plan.cta_renew_plan")
            : t("plan.cta_choose_plan")
          : isSubscribed && canShowRenew
            ? t("plan.cta_renew_plan")
            : isSubscribed && atDeviceLimit
              ? t("plan.cta_upgrade_plan")
              : isSubscribed
                ? t("plan.cta_upgrade_plan")
                : t("plan.cta_choose_plan"),
      manageLabel:
        routeReason === "no_device" ? t("plan.cta_add_device") : t("plan.cta_manage_devices"),
    }),
    [
      heroPlan,
      primarySub,
      selectedTierPlan,
      heroDurationDays,
      expiryPercent,
      subscriptionState,
      heroPlanId,
      deviceLimit,
      activeDeviceCount,
      atDeviceLimit,
      canShowRenew,
      showUpsellExpiry,
      showUpsellTrialEnd,
      isSubscribed,
      routeReason,
      t,
      locale,
    ],
  );

  const header: StandardPageHeader = {
    title: t("plan.header_title"),
    subtitle: isSubscribed
      ? t("plan.header_subtitle_subscribed")
      : t("plan.header_subtitle_no_sub"),
    badge: {
      tone: subscriptionState === "active" ? "success" : subscriptionState === "expiring" ? "warning" : "danger",
      label:
        subscriptionState === "active"
          ? t("plan.badge_active")
          : subscriptionState === "expiring"
            ? t("plan.badge_expiring")
            : t("plan.badge_expired"),
      pulse: true,
    },
  };

  const retry = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
    void queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.plans()] });
    void queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.paymentsHistoryRoot()] });
  }, [queryClient]);

  const pageState: StandardPageState = !hasToken
    ? { status: "empty", title: t("common.session_missing_title") }
    : sessionQuery.error || plansQuery.error
      ? {
          status: "error",
          title: t("common.could_not_load_title"),
          message: t("common.could_not_load_plan"),
          onRetry: retry,
        }
      : sessionQuery.isLoading || plansQuery.isLoading
        ? { status: "loading" }
        : { status: "ready" };

  return {
    hasToken,
    header,
    pageState,
    plans,
    activeSub,
    primarySub,
    recommendedRoute,
    routeReason,
    currentPlan,
    canShowRenew,
    showUpsellExpiry,
    showUpsellTrialEnd,
    renewalTargetTo,
    upgradeTargetTo,
    isSubscribed,
    daysLeft,
    subscriptionState,
    track: telemetry.track,
    tierPairs,
    visibleTierPairs,
    hasAnnualOptions,
    shouldShowPlanOptions,
    billingHistoryItems,
    historyLoading: historyQuery.isLoading,
    historyError: historyQuery.error,
    nextStepCard,
    heroView,
    formatStars,
    locale,
    activeDeviceCount,
    deviceLimit,
  };
}
