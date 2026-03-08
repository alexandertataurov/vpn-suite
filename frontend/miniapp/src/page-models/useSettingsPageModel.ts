import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ApiError,
  type WebAppMeProfileUpdate,
  type WebAppMeProfileUpdateResponse,
  type WebAppSubscriptionOffersResponse,
} from "@vpn-suite/shared";
import { useSession } from "@/hooks/useSession";
import { useWebappToken, webappApi } from "@/api/client";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useTrackScreen } from "@/hooks/useTrackScreen";
import { useToast } from "@/design-system";
import { webappQueryKeys } from "@/lib/query-keys/webapp.query-keys";
import type { StandardPageHeader, StandardPageState, StandardSectionBadge } from "./types";
import { getActiveDevices, getActiveSubscription } from "./helpers";

const PROFILE_LOCALE_OPTIONS = [
  { id: "en", label: "English" },
  { id: "ru", label: "Русский" },
] as const;
export type ProfileLocaleId = (typeof PROFILE_LOCALE_OPTIONS)[number]["id"];

export type CancelReasonGroup = "price" | "not_needed" | "technical" | "other";

export interface CancelActionPayload {
  reason_group: CancelReasonGroup;
  reason_code: string;
  free_text?: string;
  pause_instead?: boolean;
  cancel_at_period_end?: boolean;
  offer_accepted?: boolean;
}

export function useSettingsPageModel() {
  const hasToken = !!useWebappToken();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useSession(hasToken);
  const { addToast } = useToast();
  const activeSub = getActiveSubscription(data);
  const { track } = useTelemetry(activeSub?.plan_id ?? null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState<CancelReasonGroup>("not_needed");
  const [cancelFreeText, setCancelFreeText] = useState("");
  const [profileDisplayName, setProfileDisplayName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileLocale, setProfileLocale] = useState<ProfileLocaleId>("en");
  useTrackScreen("settings", activeSub?.plan_id ?? null);

  useEffect(() => {
    const u = data?.user;
    if (!u) return;
    setProfileDisplayName((u.display_name ?? "").trim());
    setProfileEmail((u.email ?? "").trim());
    setProfilePhone((u.phone ?? "").trim());
    const loc = (u.locale ?? "").trim().toLowerCase();
    setProfileLocale(loc === "ru" || loc === "en" ? loc : "en");
  }, [data?.user?.id, data?.user?.display_name, data?.user?.email, data?.user?.phone, data?.user?.locale]);

  const offersReasonGroup = cancelOpen ? cancelReason : "";
  const { data: offers, isLoading: offersLoading, error: offersError } = useQuery<WebAppSubscriptionOffersResponse>({
    queryKey: [...webappQueryKeys.subscriptionOffers(offersReasonGroup)],
    queryFn: () => {
      const path = offersReasonGroup
        ? `/webapp/subscription/offers?reason_group=${encodeURIComponent(offersReasonGroup)}`
        : "/webapp/subscription/offers";
      return webappApi.get<WebAppSubscriptionOffersResponse>(path);
    },
    enabled: hasToken,
  });

  const pauseMutation = useMutation({
    mutationFn: () => webappApi.post("/webapp/subscription/pause", { subscription_id: offers?.subscription_id }),
    onSuccess: () => {
      addToast("Subscription paused", "success");
      queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
      queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.subscriptionOffersRoot()] });
    },
    onError: () => addToast("Could not pause subscription", "error"),
  });

  const resumeMutation = useMutation({
    mutationFn: () => webappApi.post("/webapp/subscription/resume", { subscription_id: offers?.subscription_id }),
    onSuccess: () => {
      addToast("Subscription resumed", "success");
      queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
      queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.subscriptionOffersRoot()] });
    },
    onError: () => addToast("Could not resume subscription", "error"),
  });

  const cancelMutation = useMutation({
    mutationFn: async (payload: CancelActionPayload) => {
      return webappApi.post("/webapp/subscription/cancel", {
        subscription_id: offers?.subscription_id ?? undefined,
        reason_code: payload.reason_code,
        reason_group: payload.reason_group,
        free_text: payload.free_text || undefined,
        offer_accepted: payload.offer_accepted ?? false,
        pause_instead: payload.pause_instead ?? false,
        cancel_at_period_end: payload.cancel_at_period_end ?? false,
      });
    },
    onSuccess: (_data, vars) => {
      if (vars.pause_instead) {
        track("pause_selected", { screen_name: "settings" });
        addToast("Subscription paused", "success");
      }
      else if (vars.cancel_at_period_end) addToast("Subscription will cancel at period end", "success");
      else addToast("Subscription cancelled", "success");
      queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
      queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.subscriptionOffersRoot()] });
      setCancelOpen(false);
      setCancelReason("not_needed");
      setCancelFreeText("");
    },
    onError: () => addToast("Could not update subscription", "error"),
  });

  const handleCancelAction = useCallback(
    (payload: Omit<CancelActionPayload, "reason_group" | "reason_code">) => {
      cancelMutation.mutate({
        reason_group: cancelReason,
        reason_code: cancelReason,
        ...payload,
      });
    },
    [cancelReason, cancelMutation],
  );

  const revokeAllMutation = useMutation({
    mutationFn: async () => {
      const devices = getActiveDevices(data);
      for (const device of devices) {
        await webappApi.post(`/webapp/devices/${device.id}/revoke`);
      }
    },
    onSuccess: () => {
      addToast("All configs revoked", "success");
      queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
    },
    onError: () => addToast("Failed to revoke configs", "error"),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (payload: WebAppMeProfileUpdate) =>
      webappApi.patch<WebAppMeProfileUpdateResponse>("/webapp/me", payload),
    onSuccess: () => {
      addToast("Profile updated", "success");
      queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
      track("profile_updated", { screen_name: "settings" });
    },
    onError: (err) =>
      addToast(
        err instanceof ApiError ? err.message : "Could not update profile",
        "error"
      ),
  });

  const saveProfile = useCallback(() => {
    updateProfileMutation.mutate({
      display_name: profileDisplayName.trim() || undefined,
      email: profileEmail.trim() || undefined,
      phone: profilePhone.trim() || undefined,
      locale: profileLocale,
    });
  }, [
    profileDisplayName,
    profileEmail,
    profilePhone,
    profileLocale,
    updateProfileMutation,
  ]);

  const activeDevices = getActiveDevices(data);
  const planLabel = activeSub?.plan_id?.replace(/^plan_/, "") ?? "Free";

  const accountSummary = (() => {
    const u = data?.user;
    const displayName = (u?.display_name ?? "").trim() || "Account";
    const name = displayName;
    const initial = name.charAt(0).toUpperCase();
    const email = (u?.email ?? "").trim() || "—";
    const phone = (u?.phone ?? "").trim() || "—";
    const photoUrl = (u?.photo_url ?? "").trim() || undefined;
    let memberSince: string | undefined;
    const firstAt = data?.user?.first_connected_at;
    if (firstAt) {
      try {
        const d = new Date(firstAt);
        if (!Number.isNaN(d.getTime())) {
          memberSince = `Member since ${d.toLocaleDateString(undefined, { month: "short", year: "numeric" })}`;
        }
      } catch {
        // leave undefined
      }
    }
    return { initial, name, email, phone, photoUrl, memberSince };
  })();

  const offersBadge: StandardSectionBadge = {
    tone: "amber",
    label: `${offers?.discount_percent ?? 0}%`,
    emphasizeNumeric: true,
  };

  const header: StandardPageHeader = {
    title: "Account",
    subtitle: "Profile, subscription, and app controls",
    badge: { tone: "success", label: planLabel },
  };

  const profileIncomplete =
    !profileDisplayName.trim() ||
    !profileEmail.trim() ||
    !profilePhone.trim();

  const pageState: StandardPageState = !hasToken
    ? { status: "empty", title: "Session missing" }
    : error
      ? {
          status: "error",
          title: "Could not load",
          message: "We could not load settings. Please try again or contact support.",
          onRetry: () => queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] }),
        }
      : isLoading
        ? { status: "loading" }
        : { status: "ready" };

  return {
    header,
    pageState,
    accountSummary,
    profileDisplayName,
    setProfileDisplayName,
    profileEmail,
    setProfileEmail,
    profilePhone,
    setProfilePhone,
    profileLocale,
    setProfileLocale,
    saveProfile,
    updateProfileMutation,
    profileIncomplete,
    profileLocaleOptions: PROFILE_LOCALE_OPTIONS,
    offers,
    offersLoading,
    offersError,
    planLabel,
    activeDevices,
    cancelOpen,
    setCancelOpen,
    cancelReason,
    setCancelReason,
    cancelFreeText,
    setCancelFreeText,
    handleCancelAction,
    pauseMutation,
    resumeMutation,
    cancelMutation,
    revokeAllMutation,
    offersBadge,
    refetchOffers: () => queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.subscriptionOffers()] }),
    openCancelFlow: () => {
      setCancelOpen(true);
      track("cancel_flow_started", { screen_name: "settings" });
    },
    setCancelReasonWithTrack: (id: CancelReasonGroup) => {
      setCancelReason(id);
      track("cancel_reason_selected", { reason_group: id });
    },
    track,
  };
}
