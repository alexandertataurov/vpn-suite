/**
 * Intent-based copy (UPSELL-ENGINE-SPEC §15).
 */

import type { UpgradeIntent, UpsellDecision, PlanLikeForUpsell } from "./upsell.types";

const CTA_BY_TRIGGER: Record<UpgradeIntent, string> = {
  device_limit: "Add more device slots",
  expiry: "Keep protection active",
  trial_end: "Continue without interruption",
  annual_savings: "Save with annual plan",
  family: "Protect all your devices",
  premium_regions: "Unlock premium locations",
  speed: "Get faster access",
  referral: "Unlock referral rewards",
  winback: "Restore access",
  addon: "Add extra capacity",
};

export function getUpsellCopy(
  decision: UpsellDecision,
  ctx?: { currentPlan?: PlanLikeForUpsell | null; plans?: PlanLikeForUpsell[] },
): { title: string; body: string; ctaLabel: string } {
  const { trigger, targetPlanId } = decision;
  const currentPlan = ctx?.currentPlan;
  const plans = ctx?.plans ?? [];
  const targetPlan = targetPlanId ? plans.find((p) => p.id === targetPlanId) : undefined;

  let title = "";
  let body = "";

  switch (trigger) {
    case "device_limit": {
      const currentLimit = currentPlan?.device_limit ?? 0;
      const targetLimit = targetPlan?.device_limit ?? currentLimit + 1;
      const delta = targetLimit - currentLimit;
      title = "Device limit reached";
      body =
        delta > 1
          ? `Add ${delta} more device slots to protect all your devices.`
          : "Add 1 more device slot to keep another device secure.";
      break;
    }
    case "expiry":
      title = "Subscription expiring";
      body = "Renew your plan to keep secure traffic without interruption.";
      break;
    case "trial_end":
      title = "Trial ending soon";
      body = "Continue your protection with a paid plan.";
      break;
    case "referral":
      title = "Unlock referral rewards";
      body = "Upgrade your plan to unlock referral rewards.";
      break;
    case "annual_savings":
      title = "Save with annual";
      body = "Switch to annual billing and save on your subscription.";
      break;
    case "family":
      title = "Protect all devices";
      body = "Add more device slots for your family or team.";
      break;
    case "winback":
      title = "Restore access";
      body = "Reactivate your subscription to restore secure access.";
      break;
    default:
      title = "Upgrade";
      body = "Get more from your plan.";
  }

  const ctaLabel = CTA_BY_TRIGGER[trigger] ?? "Upgrade";

  return { title, body, ctaLabel };
}
