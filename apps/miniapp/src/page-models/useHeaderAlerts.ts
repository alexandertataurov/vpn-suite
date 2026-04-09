import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPlans } from "@/api";
import { useWebappToken } from "@/api/client";
import { useSession } from "@/hooks";
import { webappQueryKeys } from "@/lib";
import type { HeaderAlertItem, HeaderAlertTone } from "@/design-system";
import {
  daysUntil,
  getActiveDevices,
  getActiveSubscription,
  shouldShowUpsell,
} from "./helpers";
import type { PlanItem } from "@/api";

const TRIAL_ENDING_DAYS = 7;

function toHeaderTone(tone: "info" | "warning" | "error" | "success"): HeaderAlertTone {
  if (tone === "error") return "warning";
  return tone;
}

/**
 * Returns account-level signals as HeaderAlertItem[] for the unified notifications popover.
 * Mirrors home page model logic: health, trial/expiry, device capacity.
 */
export function useHeaderAlerts(): HeaderAlertItem[] {
  const hasToken = !!useWebappToken();
  const { data, isLoading } = useSession(hasToken);
  const activeSub = getActiveSubscription(data);
  const activeDevices = getActiveDevices(data);

  const { data: plansData } = useQuery({
    queryKey: [...webappQueryKeys.plans()],
    queryFn: getPlans,
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

    if (hasSub && isTrial && trialDaysLeft <= TRIAL_ENDING_DAYS) {
      const message =
        trialDaysLeft <= 0
          ? "Your trial ended. Choose a paid plan to keep access."
          : trialDaysLeft === 1
            ? "Your trial ends tomorrow. Upgrade to keep access."
            : `Your trial ends in ${trialDaysLeft} days. Upgrade to keep access.`;
      items.push({
        id: "account-trial",
        tone: toHeaderTone(trialDaysLeft <= 0 ? "error" : "warning"),
        title: "Trial",
        message,
        actionLabel: trialDaysLeft <= 0 ? "Choose plan" : "View plans",
        actionTo: "/plan",
      });
    } else if (hasSub && daysLeft <= 7) {
      const message =
        daysLeft <= 0
          ? "Your plan expired. Renew to restore access."
          : daysLeft === 1
            ? "Your plan ends tomorrow. Renew to avoid interruption."
            : `Your plan ends in ${daysLeft} days. Renew to avoid interruption.`;
      items.push({
        id: "account-expiry",
        tone: toHeaderTone(daysLeft <= 0 ? "error" : "warning"),
        title: "Subscription",
        message,
        actionLabel: daysLeft <= 0 ? "Restore access" : "Manage plan",
        actionTo: daysLeft <= 0 ? "/restore-access" : "/plan",
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
        actionLabel: atLimit ? "Manage devices" : "Open devices",
        actionTo: "/devices",
      });
    }

    return items;
  }, [
    hasToken,
    isLoading,
    hasSub,
    isTrial,
    trialDaysLeft,
    daysLeft,
    deviceLimit,
    usedDevices,
    showUpsellDeviceLimit,
  ]);
}
