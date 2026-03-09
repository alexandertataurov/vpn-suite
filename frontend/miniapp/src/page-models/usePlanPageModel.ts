import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { WebAppBillingHistoryResponse, WebAppUsageResponse } from "@vpn-suite/shared";
import { getPlans } from "@/api";
import { useWebappToken, webappApi } from "@/api/client";
import { useSession } from "@/hooks/useSession";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useTrackScreen } from "@/hooks/useTrackScreen";
import { webappQueryKeys } from "@/lib/query-keys/webapp.query-keys";
import type { PlanItem, PlansResponse } from "@/api";
import type { StandardPageHeader, StandardPageState } from "./types";
import {
  daysUntil,
  getActiveSubscription,
  getRenewalCheckoutPath,
  getUpgradeCheckoutPath,
  shouldShowUpsell,
} from "./helpers";
import {
  buildTierPairs,
  buildNextStepCard,
  tierSortRank,
  formatStars,
  periodLabelForHero,
  sanitizePlanDisplayName,
  usageToneFromPercent,
  toBillingHistoryView,
  clamp,
  DEFAULT_USAGE_SOFT_CAP_BYTES,
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
  | "cancelled_at_period_end"
  | "no_device"
  | "connection_not_confirmed"
  | "connected_user"
  | "unknown";

export function usePlanPageModel() {
  const hasToken = !!useWebappToken();
  const queryClient = useQueryClient();
  const sessionQuery = useSession(hasToken);
  const plansQuery = useQuery({
    queryKey: [...webappQueryKeys.plans()],
    queryFn: getPlans,
    enabled: hasToken,
  });
  const usageQuery = useQuery<WebAppUsageResponse>({
    queryKey: [...webappQueryKeys.usage("7d")],
    queryFn: () => webappApi.get<WebAppUsageResponse>("/webapp/usage?range=7d"),
    enabled: hasToken,
    staleTime: 60_000,
  });
  const historyQuery = useQuery<WebAppBillingHistoryResponse>({
    queryKey: [...webappQueryKeys.paymentsHistory(8)],
    queryFn: () => webappApi.get<WebAppBillingHistoryResponse>("/webapp/payments/history?limit=8&offset=0"),
    enabled: hasToken,
  });

  const plans = useMemo(() => plansQuery.data?.items ?? [], [plansQuery.data?.items]);
  const activeSub = getActiveSubscription(sessionQuery.data);
  const primarySub = activeSub ?? sessionQuery.data?.subscriptions?.[0] ?? null;
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

  useTrackScreen("plan", primarySub?.plan_id ?? null);
  const telemetry = useTelemetry(primarySub?.plan_id ?? null);

  const planMap = useMemo(() => new Map(plans.map((p) => [p.id, p])), [plans]);
  const heroPlan = primarySub ? planMap.get(primarySub.plan_id) : undefined;
  const tierPairs = useMemo(
    () => buildTierPairs(plans, primarySub?.plan_id ?? null),
    [plans, primarySub?.plan_id],
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

  const activeDeviceCount =
    sessionQuery.data?.devices?.filter((d: { revoked_at?: string | null }) => !d.revoked_at).length ?? 0;
  const deviceLimit = primarySub?.device_limit ?? 0;
  const usageData = usageQuery.data;
  const totalTrafficBytes = useMemo(
    () =>
      (usageData?.points ?? []).reduce(
        (sum, point) => sum + (point.bytes_in ?? 0) + (point.bytes_out ?? 0),
        0,
      ),
    [usageData?.points],
  );
  const devicePercent =
    deviceLimit > 0 ? clamp((activeDeviceCount / deviceLimit) * 100, 0, 100) : 0;
  const dataPercent = activeSub
    ? clamp((totalTrafficBytes / DEFAULT_USAGE_SOFT_CAP_BYTES) * 100, 0, 100)
    : 0;
  const uptimePercent =
    !activeSub || (typeof usageData?.sessions !== "number" || activeDeviceCount <= 0)
      ? 99.8
      : clamp((usageData.sessions / activeDeviceCount) * 100, 0, 100);
  const heroDurationDays = heroPlan?.duration_days ?? 30;
  const isLifetimePlan =
    !!heroPlan &&
    (heroPlan.duration_days >= LIFETIME_DURATION_THRESHOLD ||
      /lifetime/i.test(heroPlan.name ?? ""));
  const expiryPercent = isLifetimePlan
    ? 99.9
    : subscriptionState === "expired"
      ? 0
      : clamp((daysLeft / Math.max(heroDurationDays, 1)) * 100, 0, 100);

  const usageSummary = useMemo(
    () => ({
      activeDeviceCount,
      deviceLimit,
      devicePercent,
      dataPercent,
      uptimePercent,
      deviceTone: usageToneFromPercent(devicePercent),
      dataTone: usageToneFromPercent(dataPercent),
      uptimeTone: usageToneFromPercent(uptimePercent),
      totalTrafficBytes,
    }),
    [
      activeDeviceCount,
      deviceLimit,
      devicePercent,
      dataPercent,
      uptimePercent,
      totalTrafficBytes,
    ],
  );

  const billingHistoryItems = useMemo(
    () => toBillingHistoryView(historyQuery.data?.items ?? [], formatStars),
    [historyQuery.data?.items],
  );

  const nextStepCard = useMemo(
    () =>
      buildNextStepCard({
        isSubscribed,
        routeReason,
        recommendedRoute,
      }),
    [isSubscribed, routeReason, recommendedRoute],
  );

  const selectedTierPlan = visibleTierPairs[0]
    ? (visibleTierPairs[0].annual ?? visibleTierPairs[0].monthly)
    : undefined;
  const heroPlanId = primarySub?.plan_id ?? selectedTierPlan?.id ?? null;
  const atDeviceLimit = deviceLimit > 0 && activeDeviceCount >= deviceLimit;
  const heroView = useMemo(
    () => ({
      heroPlanName: sanitizePlanDisplayName(heroPlan?.name?.trim() ?? primarySub?.plan_id ?? "No active plan"),
      heroPlanPeriod: periodLabelForHero(heroPlan?.duration_days ?? 30),
      heroStars: heroPlan?.price_amount ?? selectedTierPlan?.price_amount ?? 0,
      heroPeriodDetail: heroPlan
        ? `for ${heroPlan.duration_days} days`
        : selectedTierPlan
          ? `for ${selectedTierPlan.duration_days} days`
          : "",
      expiryText: primarySub?.valid_until
        ? new Date(primarySub.valid_until).toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "No active subscription",
      expiryPercent,
      expiryFillClass: (subscriptionState === "expired"
        ? "crit"
        : subscriptionState === "expiring"
          ? "warn"
          : "ok") as "ok" | "warn" | "crit",
      compactPlanId: heroPlanId ? `${heroPlanId.slice(0, 8)}···` : "--",
      heroPlanId,
      devicesLabel:
        deviceLimit > 0 ? `${activeDeviceCount} / ${deviceLimit}` : `${activeDeviceCount}`,
      renewLabel:
        subscriptionState === "expiring" || subscriptionState === "expired"
          ? showUpsellExpiry || showUpsellTrialEnd
            ? "Renew plan"
            : "View plans"
          : isSubscribed && atDeviceLimit
            ? "Upgrade to add devices"
            : isSubscribed
              ? "Upgrade Plan"
              : "Choose plan",
      manageLabel: routeReason === "no_device" ? "Issue Device" : "View devices",
    }),
    [
      heroPlan,
      primarySub,
      selectedTierPlan,
      expiryPercent,
      subscriptionState,
      heroPlanId,
      deviceLimit,
      activeDeviceCount,
      atDeviceLimit,
      showUpsellExpiry,
      showUpsellTrialEnd,
      isSubscribed,
      routeReason,
    ],
  );

  const header: StandardPageHeader = {
    title: "Plan & Billing",
    subtitle: "Subscription, renewal, and usage",
    badge: {
      tone: subscriptionState === "active" ? "success" : subscriptionState === "expiring" ? "warning" : "danger",
      label: subscriptionState === "active" ? "Active" : subscriptionState === "expiring" ? "Expiring" : "Expired",
      pulse: true,
    },
  };

  const retry = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
    void queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.plans()] });
    void queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.paymentsHistoryRoot()] });
  }, [queryClient]);

  const pageState: StandardPageState = !hasToken
    ? { status: "empty", title: "Session missing" }
    : sessionQuery.error || plansQuery.error
      ? {
          status: "error",
          title: "Could not load",
          message: "We could not load your plan or options. Please try again or contact support.",
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
    usageSummary,
    billingHistoryItems,
    historyLoading: historyQuery.isLoading,
    historyError: historyQuery.error,
    nextStepCard,
    heroView,
    formatStars,
  };
}
