import { connectionStatus } from "@/features/devices/utils/deviceFormatting";
import type { DeviceOut, PaymentOut, PlanOut, SubscriptionOut, UserDetail, UserOut } from "@/shared/types/admin-api";

export type CustomerAttentionSeverity = "critical" | "warning" | "info" | "healthy";
export type CustomerAttentionSource = "user" | "device" | "subscription" | "payment" | "plan";
export type CustomerAttentionAction =
  | "inspect_user"
  | "recover_device"
  | "message_user"
  | "open_billing"
  | "grant_extension"
  | "review_plan";

export interface CustomerAttentionSignal {
  id: string;
  userId: number;
  severity: CustomerAttentionSeverity;
  source: CustomerAttentionSource;
  action: CustomerAttentionAction;
  title: string;
  detail: string;
  occurredAt?: string | null;
  targetId?: string | number | null;
  category: "account" | "device" | "billing" | "trial" | "plan";
}

export interface CustomerAttentionSummary {
  userId: number;
  signals: CustomerAttentionSignal[];
  topSignal: CustomerAttentionSignal;
  score: number;
}

interface CustomerAttentionInput {
  user: UserOut | UserDetail;
  devices?: DeviceOut[];
  subscriptions?: SubscriptionOut[];
  payments?: PaymentOut[];
  plans?: PlanOut[];
}

const SEVERITY_WEIGHT: Record<CustomerAttentionSeverity, number> = {
  critical: 100,
  warning: 60,
  info: 20,
  healthy: 0,
};

const TRIAL_ENDING_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

export function attentionSeverityVariant(
  severity: CustomerAttentionSeverity
): "danger" | "warning" | "info" | "success" | "neutral" {
  if (severity === "critical") return "danger";
  if (severity === "warning") return "warning";
  if (severity === "info") return "info";
  if (severity === "healthy") return "success";
  return "neutral";
}

export function compareAttentionSummaries(a: CustomerAttentionSummary, b: CustomerAttentionSummary): number {
  if (a.score !== b.score) return b.score - a.score;
  const aTime = new Date(a.topSignal.occurredAt ?? 0).getTime();
  const bTime = new Date(b.topSignal.occurredAt ?? 0).getTime();
  return bTime - aTime;
}

export function getDeviceAttentionScore(device: DeviceOut): number {
  const telemetry = device.telemetry;
  const conn = connectionStatus(device);
  let score = 0;
  if (conn === "Node offline") score += 4;
  if (conn === "Disconnected") score += 3;
  if (conn === "No telemetry") score += 2;
  if (telemetry?.reconciliation_status === "broken") score += 4;
  if (telemetry?.reconciliation_status === "needs_reconcile") score += 2;
  if (!device.allowed_ips) score += 2;
  if ((telemetry?.transfer_rx_bytes ?? 0) + (telemetry?.transfer_tx_bytes ?? 0) === 0) score += 1;
  if (device.suspended_at) score += 1;
  return score;
}

export function computeDeviceAttentionSignal(device: DeviceOut): CustomerAttentionSignal | null {
  const score = getDeviceAttentionScore(device);
  if (score === 0 || device.revoked_at) return null;
  const conn = connectionStatus(device);
  const severity: CustomerAttentionSeverity =
    score >= 5 || conn === "Node offline" || device.telemetry?.reconciliation_status === "broken"
      ? "critical"
      : "warning";
  const reason =
    device.telemetry?.telemetry_reason ||
    device.last_error ||
    (conn === "Node offline" ? "Node is offline" : null) ||
    (conn === "Disconnected" ? "Peer is disconnected" : null) ||
    (!device.allowed_ips ? "Missing allowed IPs" : null) ||
    "Device health requires operator review.";

  return {
    id: `device:${device.id}`,
    userId: device.user_id,
    severity,
    source: "device",
    action: "recover_device",
    title: conn === "Node offline" ? "Node offline" : "Device needs attention",
    detail: `${device.device_name || device.id}: ${reason}`,
    occurredAt: device.telemetry?.handshake_latest_at ?? device.issued_at,
    targetId: device.id,
    category: "device",
  };
}

export function computeCustomerAttention(input: CustomerAttentionInput): CustomerAttentionSummary {
  const { user } = input;
  const devices = input.devices ?? [];
  const subscriptions = input.subscriptions ?? [];
  const payments = input.payments ?? [];
  const planById = new Map((input.plans ?? []).map((plan) => [plan.id, plan]));
  const signals: CustomerAttentionSignal[] = [];

  if (user.is_banned) {
    signals.push({
      id: `user:${user.id}:banned`,
      userId: user.id,
      severity: "warning",
      source: "user",
      action: "inspect_user",
      title: "Banned account",
      detail: "Account is banned; review whether devices, billing, or messaging need follow-up.",
      occurredAt: user.updated_at,
      targetId: user.id,
      category: "account",
    });
  }

  const activeSubscriptions = subscriptions.filter((sub) => (sub.effective_status ?? sub.status) === "active");
  if (subscriptions.length === 0) {
    signals.push({
      id: `subscription:${user.id}:missing`,
      userId: user.id,
      severity: "critical",
      source: "subscription",
      action: "open_billing",
      title: "No subscription",
      detail: "User has no subscription record in the loaded scope.",
      occurredAt: user.updated_at,
      targetId: user.id,
      category: "billing",
    });
  } else if (activeSubscriptions.length === 0) {
    const latest = [...subscriptions].sort((a, b) => new Date(b.valid_until).getTime() - new Date(a.valid_until).getTime())[0];
    signals.push({
      id: `subscription:${user.id}:inactive`,
      userId: user.id,
      severity: "critical",
      source: "subscription",
      action: "grant_extension",
      title: "No active subscription",
      detail: latest ? `Latest subscription is ${latest.effective_status ?? latest.status}.` : "No active access found.",
      occurredAt: latest?.valid_until ?? user.updated_at,
      targetId: latest?.id ?? user.id,
      category: "billing",
    });
  }

  for (const sub of subscriptions) {
    const status = sub.effective_status ?? sub.status;
    if (status === "expired" || status === "blocked" || status === "cancelled") {
      signals.push({
        id: `subscription:${sub.id}:${status}`,
        userId: user.id,
        severity: status === "blocked" ? "critical" : "warning",
        source: "subscription",
        action: "open_billing",
        title: status === "blocked" ? "Blocked subscription" : "Expired subscription",
        detail: `${sub.plan_id} is ${status}.`,
        occurredAt: sub.valid_until,
        targetId: sub.id,
        category: "billing",
      });
    }

    const validUntil = new Date(sub.valid_until).getTime();
    const isTrial = sub.billing_status === "trial" || sub.renewal_status === "trial" || sub.plan_id.toLowerCase().includes("trial");
    if (isTrial && Number.isFinite(validUntil) && validUntil > Date.now() && validUntil - Date.now() <= TRIAL_ENDING_WINDOW_MS) {
      signals.push({
        id: `subscription:${sub.id}:trial-ending`,
        userId: user.id,
        severity: "info",
        source: "subscription",
        action: "message_user",
        title: "Trial ending",
        detail: `${sub.plan_id} trial ends soon.`,
        occurredAt: sub.valid_until,
        targetId: sub.id,
        category: "trial",
      });
    }

    const plan = planById.get(sub.plan_id);
    if (plan?.is_archived) {
      signals.push({
        id: `plan:${sub.plan_id}:archived`,
        userId: user.id,
        severity: "info",
        source: "plan",
        action: "review_plan",
        title: "Archived plan",
        detail: `${sub.plan_id} is archived but still attached to this user.`,
        occurredAt: sub.created_at,
        targetId: sub.plan_id,
        category: "plan",
      });
    }
  }

  const activeDevices = devices.filter((device) => !device.revoked_at);
  if (activeDevices.length === 0) {
    signals.push({
      id: `device:${user.id}:none`,
      userId: user.id,
      severity: activeSubscriptions.length > 0 ? "warning" : "info",
      source: "device",
      action: "inspect_user",
      title: "No devices",
      detail: activeSubscriptions.length > 0 ? "Active subscription has no active devices." : "No active devices in the loaded scope.",
      occurredAt: user.updated_at,
      targetId: user.id,
      category: "device",
    });
  }

  for (const device of activeDevices) {
    const signal = computeDeviceAttentionSignal(device);
    if (signal) signals.push(signal);
  }

  for (const payment of payments) {
    if (payment.status === "failed" || payment.status === "pending") {
      signals.push({
        id: `payment:${payment.id}:${payment.status}`,
        userId: user.id,
        severity: payment.status === "failed" ? "critical" : "warning",
        source: "payment",
        action: "open_billing",
        title: payment.status === "failed" ? "Payment failed" : "Payment pending",
        detail: `${payment.provider} payment for ${payment.amount} ${payment.currency} is ${payment.status}.`,
        occurredAt: payment.created_at,
        targetId: payment.id,
        category: "billing",
      });
    }
  }

  if (signals.length === 0) {
    signals.push({
      id: `healthy:${user.id}`,
      userId: user.id,
      severity: "healthy",
      source: "user",
      action: "inspect_user",
      title: "No attention needed",
      detail: "Loaded account, device, billing, and payment signals are healthy.",
      occurredAt: user.updated_at,
      targetId: user.id,
      category: "account",
    });
  }

  signals.sort((a, b) => {
    const severity = SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity];
    if (severity !== 0) return severity;
    return new Date(b.occurredAt ?? 0).getTime() - new Date(a.occurredAt ?? 0).getTime();
  });

  return {
    userId: user.id,
    signals,
    topSignal: signals[0]!,
    score: signals.reduce((sum, signal) => sum + SEVERITY_WEIGHT[signal.severity], 0),
  };
}
