import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ApiError,
  type WebAppMeProfileUpdate,
  type WebAppMeProfileUpdateResponse,
  type WebAppSubscriptionOffersResponse,
} from "@vpn-suite/shared";
import { useSession } from "@/hooks/useSession";
import { useTelegramInitData } from "@/hooks/telegram/useTelegramInitData";
import { useWebappToken, webappApi } from "@/api/client";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useTrackScreen } from "@/hooks/useTrackScreen";
import { useToast } from "@/design-system";
import { webappQueryKeys } from "@/lib/query-keys/webapp.query-keys";
import { useI18n } from "@/hooks/useI18n";
import { setWebappToken } from "@/api/client";
import type { StandardPageHeader, StandardPageState } from "./types";
import { getActiveDevices, getActiveSubscription } from "./helpers";

export type ProfileLocaleId = "auto" | "en" | "ru";

export type CancelReasonGroup = "price" | "not_needed" | "technical" | "other";

export interface CancelActionPayload {
  reason_group: CancelReasonGroup;
  reason_code: string;
  free_text?: string;
  pause_instead?: boolean;
  cancel_at_period_end?: boolean;
  offer_accepted?: boolean;
}

function resolveTelegramLocale(languageCode: string | undefined): "en" | "ru" {
  if (!languageCode) return "en";
  const code = languageCode.trim().toLowerCase().slice(0, 2);
  return code === "ru" ? "ru" : "en";
}

function formatPlanLabel(rawPlanId: string | null | undefined, t: (key: string) => string): string {
  if (!rawPlanId) return t("settings.plan_none_label");
  const normalized = rawPlanId.replace(/^plan[-_]/i, "").trim();
  if (!normalized) return t("settings.plan_active_label");
  if (/^[a-f0-9]{20,}$/i.test(normalized) || normalized.length > 24) {
    return t("settings.plan_active_label");
  }
  return normalized
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function useSettingsPageModel() {
  const hasToken = !!useWebappToken();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useSession(hasToken);
  const { user: tgUser } = useTelegramInitData();
  const tgLanguageCode = tgUser?.language_code;
  const { addToast } = useToast();
  const activeSub = getActiveSubscription(data);
  const { track } = useTelemetry(activeSub?.plan_id ?? null);
  const { t } = useI18n();
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
  }, [data?.user]);

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
      addToast(t("settings.pause_subscription"), "success");
      queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
      queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.subscriptionOffersRoot()] });
    },
    onError: () => addToast(t("common.could_not_load_generic"), "error"),
  });

  const resumeMutation = useMutation({
    mutationFn: () => webappApi.post("/webapp/subscription/resume", { subscription_id: offers?.subscription_id }),
    onSuccess: () => {
      addToast(t("settings.resume_subscription"), "success");
      queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
      queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.subscriptionOffersRoot()] });
    },
    onError: () => addToast(t("common.could_not_load_generic"), "error"),
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
        addToast(t("settings.pause_subscription"), "success");
      } else if (vars.cancel_at_period_end) {
        addToast(t("settings.cancel_at_period_end"), "success");
      } else {
        addToast(t("settings.cancel_subscription"), "success");
      }
      queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
      queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.subscriptionOffersRoot()] });
      setCancelOpen(false);
      setCancelReason("not_needed");
      setCancelFreeText("");
    },
    onError: () => addToast(t("common.could_not_load_generic"), "error"),
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
      addToast(t("settings.danger_reset_button"), "success");
      queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
    },
    onError: () => addToast(t("common.could_not_load_generic"), "error"),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (payload: WebAppMeProfileUpdate) =>
      webappApi.patch<WebAppMeProfileUpdateResponse>("/webapp/me", payload),
    onSuccess: () => {
      addToast(t("settings.save_profile"), "success");
      queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
      track("profile_updated", { screen_name: "settings" });
    },
    onError: (err) =>
      addToast(
        err instanceof ApiError ? err.message : t("common.could_not_load_generic"),
        "error",
      ),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (confirmToken: string) =>
      webappApi.request<null>("/webapp/me", {
        method: "DELETE",
        body: JSON.stringify({ confirm_token: confirmToken }),
      }),
    onSuccess: () => {
      addToast(t("settings.delete_account_success"), "success");
      queryClient.clear();
      setWebappToken(null);
    },
    onError: (err) =>
      addToast(
        err instanceof ApiError ? err.message : t("common.could_not_load_generic"),
        "error",
      ),
  });

  const handlePause = useCallback(() => pauseMutation.mutate(), [pauseMutation]);
  const handleResume = useCallback(() => resumeMutation.mutate(), [resumeMutation]);
  const handleRevokeAll = useCallback(() => revokeAllMutation.mutate(), [revokeAllMutation]);
  const handleDeleteAccount = useCallback(
    (confirmToken: string) => deleteAccountMutation.mutate(confirmToken),
    [deleteAccountMutation],
  );
  const handleUpdateLocale = useCallback(
    (id: ProfileLocaleId) => {
      if (id === "auto") {
        const resolved = resolveTelegramLocale(tgLanguageCode);
        updateProfileMutation.mutate({ locale: resolved });
      } else {
        setProfileLocale(id);
        updateProfileMutation.mutate({ locale: id });
      }
    },
    [updateProfileMutation, tgLanguageCode],
  );

  const effectiveTelegramLocale = resolveTelegramLocale(tgLanguageCode);

  const saveProfile = useCallback(() => {
    const localeToSend = profileLocale === "auto" ? resolveTelegramLocale(tgLanguageCode) : profileLocale;
    updateProfileMutation.mutate({
      display_name: profileDisplayName.trim() || undefined,
      email: profileEmail.trim() || undefined,
      phone: profilePhone.trim() || undefined,
      locale: localeToSend,
    });
  }, [
    profileDisplayName,
    profileEmail,
    profilePhone,
    profileLocale,
    tgLanguageCode,
    updateProfileMutation,
  ]);

  const activeDevices = getActiveDevices(data);
  const planLabel = formatPlanLabel(activeSub?.plan_id ?? null, t);

  const accountSummary = (() => {
    const u = data?.user;
    const displayName = (u?.display_name ?? "").trim() || t("settings.header_title");
    const name = displayName;
    const initial = name.charAt(0).toUpperCase();
    const email = (u?.email ?? "").trim();
    const phone = (u?.phone ?? "").trim() || "—";
    const photoUrl = (u?.photo_url ?? "").trim() || undefined;
    let memberSince: string | undefined;
    const firstAt = data?.user?.first_connected_at;
    if (firstAt) {
      try {
        const d = new Date(firstAt);
        if (!Number.isNaN(d.getTime())) {
          memberSince = t("settings.member_since", {
            date: d.toLocaleDateString(undefined, { month: "short", year: "numeric" }),
          });
        }
      } catch {
        // leave undefined
      }
    }
    return { initial, name, email, phone, photoUrl, memberSince };
  })();

  const header: StandardPageHeader = {
    title: t("settings.header_title"),
    subtitle: t("settings.header_subtitle"),
    badge: activeSub ? { tone: "success", label: planLabel } : undefined,
  };

  const profileIncomplete =
    !profileDisplayName.trim() ||
    !profileEmail.trim() ||
    !profilePhone.trim();

  const pageState: StandardPageState = !hasToken
    ? { status: "empty", title: t("common.session_missing_title") }
    : error
      ? {
          status: "error",
          title: t("common.could_not_load_title"),
          message: t("common.could_not_load_settings"),
          onRetry: () => queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] }),
        }
      : isLoading
        ? { status: "loading" }
        : { status: "ready" };

  const profileLocaleOptions = [
    { id: "auto" as const, label: t("settings.language_auto") },
    { id: "en" as const, label: t("settings.language_en") },
    { id: "ru" as const, label: t("settings.language_ru") },
  ];

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
    isSavingProfile: updateProfileMutation.isPending,
    handleUpdateLocale,
    profileIncomplete,
    profileLocaleOptions,
    effectiveTelegramLocale,
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
    handlePause,
    handleResume,
    handleRevokeAll,
    handleDeleteAccount,
    isPausing: pauseMutation.isPending,
    isResuming: resumeMutation.isPending,
    isCancelling: cancelMutation.isPending,
    isRevoking: revokeAllMutation.isPending,
    isDeletingAccount: deleteAccountMutation.isPending,
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
