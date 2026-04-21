import type { WebAppMeResponse } from "@vpn-suite/shared";

interface PlanLike {
  id: string;
  duration_days: number;
  price_amount: number;
  display_order?: number;
}

/** Plan with device_limit for device-limit upsell targeting. */
export interface PlanLikeWithDeviceLimit extends PlanLike {
  device_limit?: number;
}

function isCommerciallyActive(subscription: NonNullable<WebAppMeResponse["subscriptions"]>[number]) {
  return (subscription.subscription_status ?? subscription.status) === "active";
}

function isAccessEnabled(subscription: NonNullable<WebAppMeResponse["subscriptions"]>[number]) {
  return (subscription.access_status ?? "enabled") === "enabled";
}

function isGrace(subscription: NonNullable<WebAppMeResponse["subscriptions"]>[number]) {
  return (subscription.access_status ?? "enabled") === "grace";
}

function isPaused(subscription: NonNullable<WebAppMeResponse["subscriptions"]>[number]) {
  return (subscription.access_status ?? "enabled") === "paused";
}

function timeValue(iso?: string | null): number {
  if (!iso) return 0;
  const value = new Date(iso).getTime();
  return Number.isFinite(value) ? value : 0;
}

function subscriptionPriority(subscription: NonNullable<WebAppMeResponse["subscriptions"]>[number]): number {
  if (isCommerciallyActive(subscription) && isAccessEnabled(subscription)) return 0;
  if (isGrace(subscription)) return 1;
  if (isPaused(subscription) && isCommerciallyActive(subscription)) return 2;
  if (subscription.cancel_at_period_end && isCommerciallyActive(subscription)) return 3;
  if ((subscription.subscription_status ?? subscription.status) === "pending") return 4;
  if ((subscription.subscription_status ?? subscription.status) === "expired") return 5;
  return 6;
}

export function getPrimarySubscription(session?: WebAppMeResponse | null) {
  const subscriptions = session?.subscriptions ?? [];
  if (subscriptions.length === 0) return null;
  return [...subscriptions].sort((a, b) => {
    const priorityDelta = subscriptionPriority(a) - subscriptionPriority(b);
    if (priorityDelta !== 0) return priorityDelta;
    return timeValue(b.valid_until) - timeValue(a.valid_until);
  })[0] ?? null;
}

export function getActiveSubscription(session?: WebAppMeResponse | null) {
  return (
    session?.subscriptions?.find(
      (subscription) => isCommerciallyActive(subscription) && isAccessEnabled(subscription),
    ) ?? null
  );
}

export function getActiveOrGraceSubscription(session?: WebAppMeResponse | null) {
  return (
    session?.subscriptions?.find(
      (subscription) =>
        isCommerciallyActive(subscription) && (isAccessEnabled(subscription) || isGrace(subscription)),
    ) ?? null
  );
}

export function getActiveDevices(session?: WebAppMeResponse | null) {
  return session?.devices?.filter((device) => !device.revoked_at) ?? [];
}

export function getConfirmedDevices(session?: WebAppMeResponse | null) {
  return getActiveDevices(session).filter((device) => device.status === "connected");
}

export function hasConfirmedConnection(session?: WebAppMeResponse | null) {
  if (!session) return false;

  // Persistent confirmation from backend: once setup is confirmed (by handshake
  // or explicit user action), we should treat VPN setup as done even if the device is
  // currently idle. This uses durable fields that the server updates:
  // - user.last_connection_confirmed_at (per-user milestone)
  // - device.last_connection_confirmed_at (per-device milestone)
  // We do not infer live connection state from transient device.status because the
  // mini app has no native or backend tunnel telemetry from AmneziaVPN.
  if (session.user?.last_connection_confirmed_at) return true;
  if (getActiveDevices(session).some((device) => device.last_connection_confirmed_at)) {
    return true;
  }

  return false;
}

export function getLatestActiveDevice(session?: WebAppMeResponse | null) {
  return getActiveDevices(session)[0] ?? null;
}

export function getLiveConnection(session?: WebAppMeResponse | null) {
  return session?.live_connection ?? null;
}

export function hasLiveConnection(session?: WebAppMeResponse | null) {
  return getLiveConnection(session)?.status === "connected";
}

export function hasKnownDisconnectedLiveState(session?: WebAppMeResponse | null) {
  return getLiveConnection(session)?.status === "disconnected";
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
    const orderA = a.display_order ?? 0;
    const orderB = b.display_order ?? 0;
    if (orderA !== orderB) return orderA - orderB;
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

export function getUpgradeCheckoutPathForDeviceLimit(
  plans: PlanLikeWithDeviceLimit[],
  currentPlanId: string | null | undefined,
): string {
  if (plans.length === 0) return "/plan?intent=device_limit";
  const currentPlan = currentPlanId ? plans.find((p) => p.id === currentPlanId) : undefined;
  const currentLimit = currentPlan?.device_limit ?? 0;
  const withHigherLimit = plans
    .filter((p) => (p.device_limit ?? 0) > currentLimit)
    .sort((a, b) => {
      const orderA = a.display_order ?? 999_999;
      const orderB = b.display_order ?? 999_999;
      if (orderA !== orderB) return orderA - orderB;
      const priceDelta = Number(a.price_amount) - Number(b.price_amount);
      if (priceDelta !== 0) return priceDelta;
      const durationDelta = a.duration_days - b.duration_days;
      if (durationDelta !== 0) return durationDelta;
      return a.id.localeCompare(b.id);
    });
  const nextByDevices = withHigherLimit[0];
  if (nextByDevices) return `/plan/checkout/${nextByDevices.id}?intent=device_limit`;
  return "/plan?intent=device_limit";
}
