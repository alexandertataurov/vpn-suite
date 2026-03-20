import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ApiError,
  type WebAppMeProfileUpdate,
  type WebAppMeProfileUpdateResponse,
  type WebAppLogoutResponse,
  type WebAppReferralStatsResponse,
  type WebAppSubscriptionOffersResponse,
} from "@vpn-suite/shared";
import { getPlans } from "@/api";
import { useSession } from "@/hooks";
import { useTelegramInitData } from "@/hooks/telegram/useTelegramInitData";
import { useWebappToken, webappApi } from "@/api/client";
import { useTelemetry, useTrackScreen } from "@/hooks";
import { useToast } from "@/design-system";
import { webappQueryKeys } from "@/lib";
import { useI18n } from "@/hooks";
import { setWebappToken } from "@/api/client";
import { appVersion, buildId } from "@/config/env";
import type { StandardPageHeader, StandardPageState } from "./types";
import { daysUntil, getActiveDevices, getActiveSubscription } from "./helpers";
import { sanitizePlanDisplayName } from "./plan-helpers";

export type ProfileLocaleId = "auto" | "en" | "ru";

export type CancelReasonGroup = "price" | "not_needed" | "technical" | "other";
export type CancelReasonSelection = CancelReasonGroup | null;

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

function formatShortDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
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
  const { t, locale } = useI18n();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState<CancelReasonSelection>(null);
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

  const offersReasonGroup = cancelOpen && cancelReason ? cancelReason : "";
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
  const { data: referralStats } = useQuery<WebAppReferralStatsResponse>({
    queryKey: [...webappQueryKeys.referralStats()],
    queryFn: () => webappApi.get<WebAppReferralStatsResponse>("/webapp/referral/stats"),
    enabled: hasToken,
  });
  const plansQuery = useQuery({
    queryKey: [...webappQueryKeys.plans()],
    queryFn: getPlans,
    enabled: hasToken && !!activeSub?.plan_id,
    staleTime: 60_000,
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
      setCancelReason(null);
      setCancelFreeText("");
    },
    onError: () => addToast(t("common.could_not_load_generic"), "error"),
  });

  const handleCancelAction = useCallback(
    (payload: Omit<CancelActionPayload, "reason_group" | "reason_code">) => {
      const trimmed = cancelFreeText.trim();
      const useOtherText = cancelReason === "other";
      const mergedFreeText =
        payload.free_text !== undefined
          ? payload.free_text
          : useOtherText && trimmed.length > 0
            ? trimmed
            : undefined;
      cancelMutation.mutate({
        reason_group: cancelReason ?? "not_needed",
        reason_code: cancelReason ?? "not_needed",
        ...payload,
        free_text: mergedFreeText,
      });
    },
    [cancelReason, cancelMutation, cancelFreeText],
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

  const logoutMutation = useMutation({
    mutationFn: async () => webappApi.post<WebAppLogoutResponse>("/webapp/logout", {}),
    onSuccess: () => {
      track("cta_click", { cta_name: "logout", screen_name: "settings" });
    },
    onError: () => {
      addToast(t("settings.logout_local_fallback"), "info");
    },
    onSettled: () => {
      queryClient.clear();
      setWebappToken(null);
    },
  });

  const handlePause = useCallback(() => pauseMutation.mutate(), [pauseMutation]);
  const handleResume = useCallback(() => resumeMutation.mutate(), [resumeMutation]);
  const handleRevokeAll = useCallback(() => revokeAllMutation.mutate(), [revokeAllMutation]);
  const handleDeleteAccount = useCallback(
    (confirmToken: string) => deleteAccountMutation.mutate(confirmToken),
    [deleteAccountMutation],
  );
  const handleLogout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);
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

  const saveProfile = useCallback(async () => {
    const localeToSend = profileLocale === "auto" ? resolveTelegramLocale(tgLanguageCode) : profileLocale;
    return updateProfileMutation.mutateAsync({
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
  const currentPlan = activeSub?.plan_id
    ? plansQuery.data?.items?.find((plan) => plan.id === activeSub.plan_id)
    : undefined;
  const planLabel = currentPlan?.name?.trim()
    ? sanitizePlanDisplayName(currentPlan.name, locale)
    : formatPlanLabel(activeSub?.plan_id ?? null, t);
  const renewalDate = formatShortDate(activeSub?.valid_until ?? null);
  const renewalDays = daysUntil(activeSub?.valid_until ?? null);
  const renewalCountdownLabel = activeSub
    ? renewalDays <= 0
      ? t("settings.renews_today")
      : renewalDays === 1
        ? t("settings.renews_tomorrow")
        : t("settings.renews_in_days", { count: renewalDays })
    : t("settings.banner_no_plan_title");
  const deviceCountLabel = activeDevices.length === 1
    ? t("settings.device_count_active_one", { count: activeDevices.length })
    : t("settings.device_count_active_other", { count: activeDevices.length });
  const totalReferrals = referralStats?.total_referrals ?? 0;
  const activeReferrals = referralStats?.active_referrals ?? 0;
  const referralSummary =
    totalReferrals > 0
      ? t("settings.referral_summary_with_stats", {
          invites: totalReferrals,
          active: activeReferrals,
        })
      : t("settings.referral_summary_empty");
  const buildLabel = `vpn-suite  v${appVersion}  (build ${buildId})`;
  const buildCopyValue = `vpn-suite v${appVersion} (${buildId})`;
  const copyBuildInfo = useCallback(async () => {
    if (!navigator.clipboard?.writeText) {
      addToast(t("devices.toast_copy_failed"), "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(buildCopyValue);
      addToast(t("settings.build_info_copied"), "success");
    } catch {
      addToast(t("devices.toast_copy_failed"), "error");
    }
  }, [addToast, buildCopyValue, t]);
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
          memberSince = new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
            month: "long",
            year: "numeric",
          }).format(d);
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
  const resolvedLocaleLabel = t(
    effectiveTelegramLocale === "ru" ? "settings.language_ru" : "settings.language_en",
  );
  const languageActiveId =
    profileLocale === effectiveTelegramLocale ? "auto" : profileLocale;
  const languageSummary =
    languageActiveId === "auto"
      ? `${t("settings.language_auto")} → ${resolvedLocaleLabel}`
      : profileLocaleOptions.find((option) => option.id === languageActiveId)?.label ??
        resolvedLocaleLabel;
  const accountStatusLabel = activeSub
    ? `${t("settings.plan_active_label")} · ${deviceCountLabel}`
    : t("settings.banner_no_plan_title");
  const accountRenewalValue = activeSub?.valid_until ? formatShortDate(activeSub.valid_until) : null;
  const accountRenewalLabel = activeSub
    ? accountRenewalValue ?? renewalCountdownLabel
    : t("settings.summary_no_plan_hint");
  const cancelPlanDescription = renewalDate
    ? t("settings.cancel_plan_description_until", { date: renewalDate })
    : t("settings.cancel_plan_description_generic");

  const closeCancelFlow = useCallback(() => {
    setCancelOpen(false);
    setCancelReason(null);
    setCancelFreeText("");
  }, []);

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
    languageActiveId,
    effectiveTelegramLocale,
    languageSummary,
    accountStatusLabel,
    accountRenewalLabel,
    accountRenewalValue,
    cancelPlanDescription,
    offers,
    offersLoading,
    offersError,
    planLabel,
    activeSub,
    renewalDate,
    renewalDays,
    renewalCountdownLabel,
    hasPlan: Boolean(activeSub),
    activeDevices,
    deviceCountLabel,
    referralSummary,
    buildLabel,
    buildCopyValue,
    buildProtocolLabel: "AmneziaWG protocol",
    copyBuildInfo,
    planActionTo: "/plan",
    devicesActionTo: "/devices",
    supportActionTo: "/support",
    cancelOpen,
    setCancelOpen,
    closeCancelFlow,
    cancelReason,
    setCancelReason,
    cancelFreeText,
    setCancelFreeText,
    handleCancelAction,
    handlePause,
    handleResume,
    handleRevokeAll,
    handleDeleteAccount,
    handleLogout,
    isPausing: pauseMutation.isPending,
    isResuming: resumeMutation.isPending,
    isCancelling: cancelMutation.isPending,
    isRevoking: revokeAllMutation.isPending,
    isDeletingAccount: deleteAccountMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    refetchOffers: () => queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.subscriptionOffers()] }),
    openCancelFlow: () => {
      setCancelOpen(true);
      setCancelReason(null);
      setCancelFreeText("");
      track("cancel_flow_started", { screen_name: "settings" });
    },
    setCancelReasonWithTrack: (id: CancelReasonGroup) => {
      setCancelReason(id);
      if (id !== "other") {
        setCancelFreeText("");
      }
      track("cancel_reason_selected", { reason_group: id });
    },
    track,
  };
}
