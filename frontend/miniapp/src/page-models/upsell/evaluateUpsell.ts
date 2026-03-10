/**
 * Upsell decision engine (UPSELL-ENGINE-SPEC §9).
 * Evaluates context, applies priority and suppression, returns single best offer.
 */

import type { UpgradeIntent, UpsellContext, UpsellDecision, PlanLikeForUpsell } from "./upsell.types";
import { TRIGGER_PRIORITY } from "./upsell.constants";
import { shouldSuppressUpsell } from "./shouldSuppressUpsell";
import { getUpgradeOfferForIntent } from "./getUpgradeOfferForIntent";
import type { TranslateFn } from "./getUpsellCopy";
import { shouldShowUpsell } from "../helpers";

function triggerAllowed(plan: PlanLikeForUpsell | null | undefined, trigger: UpgradeIntent): boolean {
  return shouldShowUpsell(plan?.upsell_methods, trigger);
}

function buildCandidates(context: UpsellContext): Array<{ intent: UpgradeIntent; priority: number }> {
  const candidates: Array<{ intent: UpgradeIntent; priority: number }> = [];
  const { currentPlan, subscriptionStatus, daysToExpiry, trialDaysLeft, devicesUsed, deviceLimit, isDeviceLimitError, page } = context;

  if (page === "checkout") return [];

  if (isDeviceLimitError || (deviceLimit != null && devicesUsed != null && devicesUsed >= deviceLimit)) {
    if (triggerAllowed(currentPlan, "device_limit")) {
      candidates.push({ intent: "device_limit", priority: TRIGGER_PRIORITY.device_limit });
    }
  }

  // Expiry upsell: excluded from home page (shown in notifications via useHeaderAlerts instead).
  // Only trigger when ≤7 days left to avoid false positives for fresh plans.
  if (page !== "home") {
    if (
      subscriptionStatus === "expired" ||
      subscriptionStatus === "grace" ||
      (daysToExpiry != null && daysToExpiry <= 7)
    ) {
      if (triggerAllowed(currentPlan, "expiry")) {
        candidates.push({ intent: "expiry", priority: TRIGGER_PRIORITY.expiry });
      }
    }
  }

  if (subscriptionStatus === "trial" && trialDaysLeft != null && trialDaysLeft <= 30) {
    if (triggerAllowed(currentPlan, "trial_end")) {
      candidates.push({ intent: "trial_end", priority: TRIGGER_PRIORITY.trial_end });
    }
  }

  if (page === "referral" && triggerAllowed(currentPlan, "referral")) {
    candidates.push({ intent: "referral", priority: TRIGGER_PRIORITY.referral });
  }

  return candidates.sort((a, b) => b.priority - a.priority);
}

export function evaluateUpsell(context: UpsellContext, t: TranslateFn): UpsellDecision | null {
  const now = new Date();
  const candidates = buildCandidates(context);

  for (const { intent } of candidates) {
    const suppressed = shouldSuppressUpsell(
      intent,
      context.recentUpsellHistory,
      context.sessionShownTriggers,
      now,
    );
    if (suppressed.suppressed) continue;

    const offer = getUpgradeOfferForIntent(
      context.plans,
      context.currentPlan,
      intent,
      context.page,
      t,
    );
    if (offer) return offer;
  }

  return null;
}
