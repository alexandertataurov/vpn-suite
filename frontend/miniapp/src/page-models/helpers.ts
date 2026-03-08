import type { WebAppMeResponse } from "@vpn-suite/shared";

interface PlanLike {
  id: string;
  duration_days: number;
  price_amount: number;
}

/** Plan with device_limit for device-limit upsell targeting. */
export interface PlanLikeWithDeviceLimit extends PlanLike {
  device_limit?: number;
}

export function getActiveSubscription(session?: WebAppMeResponse | null) {
  return session?.subscriptions?.find((subscription) => subscription.status === "active") ?? null;
}

export function getActiveDevices(session?: WebAppMeResponse | null) {
  return session?.devices?.filter((device) => !device.revoked_at) ?? [];
}

export function daysUntil(iso?: string | null): number {
  if (!iso) return 0;
  const expiresMs = new Date(iso).getTime();
  if (Number.isNaN(expiresMs)) return 0;
  return Math.max(0, Math.ceil((expiresMs - Date.now()) / (1000 * 60 * 60 * 24)));
}

/**
 * True when plan allows showing upsell for this trigger.
 *
 * Legacy behavior: when `upsell_methods` is null or undefined (e.g. plan created before
 * this field existed, or admin never set triggers), we show upsell for all triggers.
 * When `upsell_methods` is set (including empty array), we show only for triggers in the list.
 * Admin can clear all checkboxes to hide upsell for that plan.
 */
export function shouldShowUpsell(upsellMethods: string[] | undefined, trigger: string): boolean {
  if (upsellMethods == null || upsellMethods === undefined) return true;
  return upsellMethods.includes(trigger);
}

function sortPlansForCheckout(plans: PlanLike[]): PlanLike[] {
  return [...plans].sort((a, b) => {
    const priceDelta = Number(a.price_amount) - Number(b.price_amount);
    if (priceDelta !== 0) return priceDelta;
    const durationDelta = a.duration_days - b.duration_days;
    if (durationDelta !== 0) return durationDelta;
    return a.id.localeCompare(b.id);
  });
}

export function getRenewalCheckoutPath(currentPlanId: string | null | undefined): string {
  return currentPlanId ? `/plan/checkout/${currentPlanId}` : "/plan";
}

export function getUpgradeCheckoutPath(
  plans: PlanLike[],
  currentPlanId: string | null | undefined,
): string {
  const sortedPlans = sortPlansForCheckout(plans);
  if (sortedPlans.length === 0) return "/plan";
  const firstPlan = sortedPlans[0];
  if (!firstPlan) return "/plan";
  if (!currentPlanId) return `/plan/checkout/${firstPlan.id}`;

  const currentIndex = sortedPlans.findIndex((plan) => plan.id === currentPlanId);
  if (currentIndex === -1) return `/plan/checkout/${firstPlan.id}`;

  const nextPlan = sortedPlans[currentIndex + 1];
  const currentPlan = sortedPlans[currentIndex];
  if (!currentPlan) return `/plan/checkout/${firstPlan.id}`;
  if (!nextPlan) return `/plan/checkout/${currentPlan.id}`;
  return `/plan/checkout/${nextPlan.id}`;
}

/**
 * For device-limit upsell: return checkout path for the cheapest plan that has
 * strictly more device_limit than the current plan. Falls back to next-by-price
 * if no plan has higher device_limit.
 */
export function getUpgradeCheckoutPathForDeviceLimit(
  plans: PlanLikeWithDeviceLimit[],
  currentPlanId: string | null | undefined,
): string {
  if (plans.length === 0) return "/plan";
  const currentPlan = currentPlanId ? plans.find((p) => p.id === currentPlanId) : undefined;
  const currentLimit = currentPlan?.device_limit ?? 0;
  const withHigherLimit = plans
    .filter((p) => (p.device_limit ?? 0) > currentLimit)
    .sort((a, b) => {
      const priceDelta = Number(a.price_amount) - Number(b.price_amount);
      if (priceDelta !== 0) return priceDelta;
      const durationDelta = a.duration_days - b.duration_days;
      if (durationDelta !== 0) return durationDelta;
      return a.id.localeCompare(b.id);
    });
  const nextByDevices = withHigherLimit[0];
  if (nextByDevices) return `/plan/checkout/${nextByDevices.id}`;
  return getUpgradeCheckoutPath(plans, currentPlanId);
}
