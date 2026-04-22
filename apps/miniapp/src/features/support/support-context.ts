import { useEffect, useState } from "react";
import type { WebAppMeResponse } from "@vpn-suite/shared";
import { appVersion, buildId } from "@/config/env";
import { getActiveDevices, getActiveSubscription, getConfirmedDevices, getLatestActiveDevice, getPrimarySubscription } from "@/page-models/helpers";

export const SUPPORT_CONTEXT_STORAGE_KEY = "vpn-suite.support-context.v1";
export const GUIDANCE_CONTEXT_ID_STORAGE_KEY = "vpn-suite.guidance-context-id.v1";

export type SupportContextPayload = {
  guidance_context_id: string;
  captured_at: string;
  user_id: number | null;
  tg_id: number | null;
  subscription_status: string;
  subscription_expires_at: string | null;
  device_count: number;
  device_limit: number | null;
  confirmed_device_count: number;
  pending_device_count: number;
  latest_device_id: string | null;
  latest_device_name: string | null;
  last_action: string;
  current_route: string;
  app_version: string;
  build_id: string;
  platform: "ios" | "android" | "desktop";
  locale: string;
  public_ip: string | null;
};

export type GuidanceFlowStage = "onboarding" | "device_setup" | "device_management" | "device_limit" | "support";

export type GuidanceTelemetryContext = {
  guidance_context_id: string;
  captured_at: string;
  flow_stage: GuidanceFlowStage;
  step_index: number | null;
  step_id: string | null;
  current_route: string;
  last_action: string;
  subscription_status: string;
  subscription_expires_at: string | null;
  device_count: number;
  device_limit: number | null;
  confirmed_device_count: number;
  pending_device_count: number;
  app_version: string;
  build_id: string;
  platform: "ios" | "android" | "desktop";
  locale: string;
};

export interface BuildSupportContextArgs {
  session?: WebAppMeResponse | null;
  currentRoute: string;
  lastAction: string;
  platform: "ios" | "android" | "desktop";
  locale: string;
  guidanceContextId: string;
}

function createGuidanceContextId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `guidance_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function readGuidanceContextIdFromStorage(): string | null {
  if (typeof window !== "undefined") {
    try {
      const existing = window.sessionStorage.getItem(GUIDANCE_CONTEXT_ID_STORAGE_KEY)?.trim();
      return existing || null;
    } catch {
      return null;
    }
  }

  return null;
}

export function useGuidanceContextId(): string {
  const [guidanceContextId] = useState(() => readGuidanceContextIdFromStorage() ?? createGuidanceContextId());

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(GUIDANCE_CONTEXT_ID_STORAGE_KEY, guidanceContextId);
    } catch {
      // Ignore storage failures; the in-memory ID remains stable for this session.
    }
  }, [guidanceContextId]);

  return guidanceContextId;
}

export function buildSupportContext({
  session,
  currentRoute,
  lastAction,
  platform,
  locale,
  guidanceContextId,
}: BuildSupportContextArgs): SupportContextPayload {
  const activeSub = getActiveSubscription(session);
  const primarySub = getPrimarySubscription(session);
  const activeDevices = getActiveDevices(session);
  const confirmedDevices = getConfirmedDevices(session);
  const latestDevice = getLatestActiveDevice(session);
  const fallbackStatus = activeSub?.status ?? primarySub?.status ?? "none";
  const pendingDeviceCount = Math.max(activeDevices.length - confirmedDevices.length, 0);

  return {
    guidance_context_id: guidanceContextId,
    captured_at: new Date().toISOString(),
    user_id: session?.user?.id ?? null,
    tg_id: session?.user?.tg_id ?? null,
    subscription_status: fallbackStatus,
    subscription_expires_at: activeSub?.valid_until ?? primarySub?.valid_until ?? null,
    device_count: activeDevices.length,
    device_limit: activeSub?.device_limit ?? primarySub?.device_limit ?? null,
    confirmed_device_count: confirmedDevices.length,
    pending_device_count: pendingDeviceCount,
    latest_device_id: latestDevice?.id ?? null,
    latest_device_name: latestDevice?.device_name ?? null,
    last_action: lastAction,
    current_route: currentRoute,
    app_version: appVersion,
    build_id: buildId,
    platform,
    locale,
    public_ip: session?.public_ip ?? null,
  };
}

export function buildGuidanceTelemetryContext(
  payload: SupportContextPayload,
  flowStage: GuidanceFlowStage,
  stepIndex: number | null,
  stepId: string | null,
): GuidanceTelemetryContext {
  return {
    guidance_context_id: payload.guidance_context_id,
    captured_at: payload.captured_at,
    flow_stage: flowStage,
    step_index: stepIndex,
    step_id: stepId,
    current_route: payload.current_route,
    last_action: payload.last_action,
    subscription_status: payload.subscription_status,
    subscription_expires_at: payload.subscription_expires_at,
    device_count: payload.device_count,
    device_limit: payload.device_limit,
    confirmed_device_count: payload.confirmed_device_count,
    pending_device_count: payload.pending_device_count,
    app_version: payload.app_version,
    build_id: payload.build_id,
    platform: payload.platform,
    locale: payload.locale,
  };
}

export function serializeSupportContext(payload: SupportContextPayload): string {
  return JSON.stringify(payload, null, 2);
}

export function persistSupportContext(payload: SupportContextPayload): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(GUIDANCE_CONTEXT_ID_STORAGE_KEY, payload.guidance_context_id);
    window.sessionStorage.setItem(SUPPORT_CONTEXT_STORAGE_KEY, serializeSupportContext(payload));
  } catch {
    // Ignore storage failures; the payload is still available in-memory for the current action.
  }
}

export function readPersistedSupportContext(): SupportContextPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SUPPORT_CONTEXT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SupportContextPayload> | null;
    if (!parsed || typeof parsed !== "object") return null;
    const guidanceContextId =
      typeof parsed.guidance_context_id === "string" && parsed.guidance_context_id.trim()
        ? parsed.guidance_context_id.trim()
        : readGuidanceContextIdFromStorage() ?? createGuidanceContextId();
    return {
      guidance_context_id: guidanceContextId,
      captured_at: typeof parsed.captured_at === "string" ? parsed.captured_at : new Date().toISOString(),
      user_id: typeof parsed.user_id === "number" ? parsed.user_id : null,
      tg_id: typeof parsed.tg_id === "number" ? parsed.tg_id : null,
      subscription_status: typeof parsed.subscription_status === "string" ? parsed.subscription_status : "none",
      subscription_expires_at:
        typeof parsed.subscription_expires_at === "string" ? parsed.subscription_expires_at : null,
      device_count: typeof parsed.device_count === "number" ? parsed.device_count : 0,
      device_limit: typeof parsed.device_limit === "number" ? parsed.device_limit : null,
      confirmed_device_count:
        typeof parsed.confirmed_device_count === "number" ? parsed.confirmed_device_count : 0,
      pending_device_count:
        typeof parsed.pending_device_count === "number" ? parsed.pending_device_count : 0,
      latest_device_id: typeof parsed.latest_device_id === "string" ? parsed.latest_device_id : null,
      latest_device_name: typeof parsed.latest_device_name === "string" ? parsed.latest_device_name : null,
      last_action: typeof parsed.last_action === "string" ? parsed.last_action : "support_opened",
      current_route: typeof parsed.current_route === "string" ? parsed.current_route : "/support",
      app_version: typeof parsed.app_version === "string" ? parsed.app_version : appVersion,
      build_id: typeof parsed.build_id === "string" ? parsed.build_id : buildId,
      platform:
        parsed.platform === "ios" || parsed.platform === "android" || parsed.platform === "desktop"
          ? parsed.platform
          : "desktop",
      locale: typeof parsed.locale === "string" ? parsed.locale : "en",
      public_ip: typeof parsed.public_ip === "string" ? parsed.public_ip : null,
    };
  } catch {
    return null;
  }
}
