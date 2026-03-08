import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWebappToken, webappApi } from "@/api/client";
import { useApiHealth } from "@/hooks/useApiHealth";
import { useSession } from "@/hooks/useSession";
import { webappQueryKeys } from "@/lib/query-keys/webapp.query-keys";
import type { HeaderAlertItem, HeaderAlertTone } from "@/design-system";
import {
  daysUntil,
  getActiveDevices,
  getActiveSubscription,
  shouldShowUpsell,
} from "@/page-models";
import type { PlanItem, PlansResponse } from "@/page-models";

const TRIAL_ENDING_DAYS = 7;

function toHeaderTone(tone: "info" | "warning" | "error" | "success"): HeaderAlertTone {
  if (tone === "error") return "warning";
  return tone;
}

/**
 * Returns account-level signals as HeaderAlertItem[] for the unified notifications popover.
 * Mirrors HomeDynamicBlock logic: health, trial/expiry, device capacity.
 */
export function useAccountSignals(): HeaderAlertItem[] {
  const hasToken = !!useWebappToken();
  const { data, isLoading } = useSession(hasToken);
  const { error: healthError } = useApiHealth(hasToken);
  const activeSub = getActiveSubscription(data);
  const activeDevices = getActiveDevices(data);

  const { data: plansData } = useQuery({
    queryKey: [...webappQueryKeys.plans()],
    queryFn: () => webappApi.get<PlansResponse>("/webapp/plans"),
    enabled: hasToken,
  });
  const plans = useMemo(() => plansData?.items ?? [], [plansData?.items]);
  const currentPlan = useMemo<PlanItem | undefined>(
    () => (activeSub?.plan_id ? plans.find((p) => p.id === activeSub.plan_id) : undefined),
    [plans, activeSub?.plan_id],
  );
  const showUpsellDeviceLimit = shouldShowUpsell(currentPlan?.upsell_methods, "device_limit");
  const trialDaysLeft = daysUntil(activeSub?.trial_ends_at);
  const isTrial = Boolean(activeSub?.is_trial);

  const deviceLimit = activeSub?.device_limit ?? null;
  const usedDevices = activeDevices.length;
  const daysLeft = daysUntil(activeSub?.valid_until);
  const hasSub = Boolean(activeSub);

  return useMemo(() => {
    if (!hasToken || isLoading) return [];

    const items: HeaderAlertItem[] = [];

    if (healthError) {
      items.push({
        id: "account-health",
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
        id: "account-trial",
        tone: toHeaderTone(trialDaysLeft <= 0 ? "error" : "warning"),
        title: "Trial",
        message,
      });
    } else if (hasSub && daysLeft <= 7) {
      const message =
        daysLeft <= 0
          ? "Your plan expired. Renew to restore secure traffic."
          : daysLeft === 1
            ? "Your plan ends tomorrow. Renew to avoid interruption."
            : `Your plan ends in ${daysLeft} days. Renew to avoid interruption.`;
      items.push({
        id: "account-expiry",
        tone: toHeaderTone(daysLeft <= 0 ? "error" : "warning"),
        title: "Subscription",
        message,
      });
    }

    if (deviceLimit != null && usedDevices >= deviceLimit - 1) {
      const atLimit = usedDevices >= deviceLimit;
      const message = atLimit
        ? `Device capacity reached (${deviceLimit}). ${showUpsellDeviceLimit ? "Upgrade your plan for more devices." : "Revoke one profile before issuing another."}`
        : `${deviceLimit - usedDevices} device slot${deviceLimit - usedDevices === 1 ? "" : "s"} remaining.`;
      items.push({
        id: "account-devices",
        tone: toHeaderTone(atLimit ? "error" : "info"),
        title: "Device capacity",
        message,
      });
    }

    return items;
  }, [
    hasToken,
    isLoading,
    healthError,
    hasSub,
    isTrial,
    trialDaysLeft,
    daysLeft,
    deviceLimit,
    usedDevices,
    showUpsellDeviceLimit,
  ]);
}
