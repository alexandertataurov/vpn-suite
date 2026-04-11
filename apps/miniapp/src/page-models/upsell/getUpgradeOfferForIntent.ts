/**
 * Intent-aware routing and resolver logic (UPSELL-ENGINE-SPEC §11).
 */

import type { UpgradeIntent, UpsellDecision, UpsellOfferType, UpsellUiVariant } from "./upsell.types";
import type { PlanLikeForUpsell } from "./upsell.types";
import { TRIGGER_PRIORITY } from "./upsell.constants";
import { getUpsellCopy, type TranslateFn } from "./getUpsellCopy";

function sortByUpgradeRelevanceForDeviceLimit(a: PlanLikeForUpsell, b: PlanLikeForUpsell): number {
  const orderA = a.display_order ?? 999_999;
  const orderB = b.display_order ?? 999_999;
  if (orderA !== orderB) return orderA - orderB;
  const priceA = Number(a.price_amount ?? 0);
  const priceB = Number(b.price_amount ?? 0);
  if (priceA !== priceB) return priceA - priceB;
  const durA = a.duration_days ?? 0;
  const durB = b.duration_days ?? 0;
  if (durA !== durB) return durA - durB;
  return (a.id ?? "").localeCompare(b.id ?? "");
}

export function getUpgradeCheckoutPathForDeviceLimit(
  plans: PlanLikeForUpsell[],
  currentPlanId?: string | null,
): string {
  const current = plans.find((p) => p.id === currentPlanId);
  const currentLimit = current?.device_limit ?? 0;
  const candidates = plans
    .filter((p) => (p.device_limit ?? 0) > currentLimit)
    .sort(sortByUpgradeRelevanceForDeviceLimit);
  const resolver = candidates[0];
  if (resolver) return `/plan/checkout/${resolver.id}?intent=device_limit`;
  return "/plan?intent=device_limit";
}

function resolveDeviceLimit(
  plans: PlanLikeForUpsell[],
  currentPlan: PlanLikeForUpsell | null | undefined,
): { targetTo: string; targetPlanId?: string } | null {
  const path = getUpgradeCheckoutPathForDeviceLimit(
    plans,
    currentPlan?.id ?? null,
  );
  const match = path.match(/\/plan\/checkout\/([^?]+)/);
  return {
    targetTo: path,
    targetPlanId: match?.[1] ?? undefined,
  };
}

function resolveExpiry(planId: string | null | undefined): { targetTo: string } | null {
  if (!planId) return { targetTo: "/plan?intent=expiry" };
  return { targetTo: `/plan/checkout/${planId}?intent=expiry` };
}

function resolveTrialEnd(plans: PlanLikeForUpsell[]): { targetTo: string; targetPlanId?: string } | null {
  const fallback = "/plan?intent=trial_end";
  if (plans.length === 0) return { targetTo: fallback };
  const sorted = [...plans].sort((a, b) => {
    const orderA = a.display_order ?? 999_999;
    const orderB = b.display_order ?? 999_999;
    if (orderA !== orderB) return orderA - orderB;
    const durA = a.duration_days ?? 0;
    const durB = b.duration_days ?? 0;
    if (durA !== durB) return durB - durA;
    return (a.id ?? "").localeCompare(b.id ?? "");
  });
  const preferred = sorted[0];
  if (!preferred) return { targetTo: fallback };
  return { targetTo: `/plan/checkout/${preferred.id}?intent=trial_end`, targetPlanId: preferred.id };
}

function resolveReferral(plans: PlanLikeForUpsell[], currentPlanId: string | null | undefined): { targetTo: string; targetPlanId?: string } | null {
  const fallback = "/plan?intent=referral";
  if (plans.length === 0) return { targetTo: fallback };
  const current = plans.find((p) => p.id === currentPlanId);
  const recommended = current?.recommended_upgrade_plan_id
    ? plans.find((p) => p.id === current.recommended_upgrade_plan_id)
    : undefined;
  const target = recommended ?? plans[0];
  if (!target) return { targetTo: fallback };
  return { targetTo: `/plan/checkout/${target.id}?intent=referral`, targetPlanId: target.id };
}

export function getUpgradeOfferForIntent(
  plans: PlanLikeForUpsell[],
  currentPlan: PlanLikeForUpsell | null | undefined,
  intent: UpgradeIntent,
  _page: string, // Reserved for placement rules (UPSELL-ENGINE-SPEC §11)
  t: TranslateFn,
): UpsellDecision | null {
  void _page;
  const offerType: UpsellOfferType =
    intent === "expiry" ? "renewal"
    : intent === "trial_end" ? "trial_convert"
    : intent === "winback" ? "winback"
    : "upgrade";

  const uiVariant: UpsellUiVariant = "card";
  const priority = TRIGGER_PRIORITY[intent] ?? 50;

  let target: { targetTo: string; targetPlanId?: string } | null = null;

  switch (intent) {
    case "device_limit":
      target = resolveDeviceLimit(plans, currentPlan);
      break;
    case "expiry":
      target = resolveExpiry(currentPlan?.id ?? undefined);
      break;
    case "trial_end":
      target = resolveTrialEnd(plans);
      break;
    case "referral":
      target = resolveReferral(plans, currentPlan?.id ?? null);
      break;
    case "annual_savings":
    case "family":
    case "premium_regions":
    case "speed":
    case "winback":
    case "addon":
      target = { targetTo: `/plan?intent=${intent}` };
      break;
    default:
      target = { targetTo: "/plan" };
  }

  if (!target) return null;

  const decision: UpsellDecision = {
    show: true,
    trigger: intent,
    priority,
    targetTo: target.targetTo,
    reason: `intent_${intent}`,
    offerType,
    uiVariant,
    title: "",
    body: "",
    ctaLabel: "",
    targetPlanId: target.targetPlanId,
  };

  const copy = getUpsellCopy(t, decision, { currentPlan, plans });
  decision.title = copy.title;
  decision.body = copy.body;
  decision.ctaLabel = copy.ctaLabel;

  return decision;
}
