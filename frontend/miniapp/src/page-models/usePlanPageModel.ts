import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { WebAppBillingHistoryResponse, WebAppUsageResponse } from "@vpn-suite/shared";
import { useWebappToken, webappApi } from "@/api/client";
import { useSession } from "@/hooks/useSession";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useTrackScreen } from "@/hooks/useTrackScreen";
import { webappQueryKeys } from "@/lib/query-keys/webapp.query-keys";
import type { StandardPageHeader, StandardPageState } from "./types";
import {
  daysUntil,
  getActiveSubscription,
  getRenewalCheckoutPath,
  getUpgradeCheckoutPath,
  shouldShowUpsell,
} from "./helpers";

export type SubscriptionState = "active" | "expiring" | "expired";
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

export interface PlanItem {
  id: string;
  name?: string;
  duration_days: number;
  device_limit?: number;
  price_amount: number;
  price_currency: string;
  style?: PlanStyle | null;
  upsell_methods?: string[];
}

export interface PlansResponse {
  items: PlanItem[];
}

export function usePlanPageModel() {
  const hasToken = !!useWebappToken();
  const sessionQuery = useSession(hasToken);
  const plansQuery = useQuery({
    queryKey: [...webappQueryKeys.plans()],
    queryFn: () => webappApi.get<PlansResponse>("/webapp/plans"),
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

  const header: StandardPageHeader = {
    title: "Plan & Billing",
    subtitle: "Subscription, renewal, and usage",
    badge: {
      tone: subscriptionState === "active" ? "success" : subscriptionState === "expiring" ? "warning" : "danger",
      label: subscriptionState === "active" ? "Active" : subscriptionState === "expiring" ? "Expiring" : "Expired",
      pulse: true,
    },
  };

  const pageState: StandardPageState = !hasToken
    ? { status: "empty", title: "Session missing" }
    : sessionQuery.error || plansQuery.error
      ? {
          status: "error",
          title: "Could not load",
          message: "We could not load your plan or options. Please try again or contact support.",
        }
      : sessionQuery.isLoading || plansQuery.isLoading
        ? { status: "loading" }
        : { status: "ready" };

  return {
    hasToken,
    header,
    pageState,
    sessionQuery,
    plansQuery,
    usageQuery,
    historyQuery,
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
  };
}
