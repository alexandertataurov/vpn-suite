import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WebAppIssueDeviceResponse, WebAppUsageResponse } from "@vpn-suite/shared";
import { getPlans } from "@/api";
import { useWebappToken, webappApi } from "@/api/client";
import {
  useOnlineStatus,
  useSession,
  useTelegramHaptics,
  useTelemetry,
  useTrackScreen,
} from "@/hooks";
import { useI18n } from "@/hooks/useI18n";
import { useToast } from "@/design-system";
import { usePrefersReducedMotion } from "@/design-system";
import { webappQueryKeys } from "@/lib";
import type { SupportedLocale } from "@/lib/i18n";
import { getErrorMessage, formatBytes } from "@/lib";
import type { MissionTone } from "@/design-system";
import type { StandardPageHeader, StandardPageState, StandardSectionBadge } from "@/page-models/types";
import type { PlansResponse } from "@/api";
import type { RecommendedRouteReason } from "@/features/plan/model/usePlanPageModel";
import {
  getActiveDevices,
  getActiveSubscription,
  getUpgradeCheckoutPath,
  getUpgradeCheckoutPathForDeviceLimit,
  shouldShowUpsell,
} from "@/page-models/helpers";
import { getUpgradeOfferForIntent, type PlanLikeForUpsell } from "@/page-models/upsell";
import { clamp, DEFAULT_USAGE_SOFT_CAP_BYTES } from "@/page-models/plan-helpers";

function formatIssuedAt(value: string, locale: SupportedLocale): string {
  const resolvedLocale = locale === "ru" ? "ru-RU" : "en-US";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(resolvedLocale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export interface DevicesPageModel {
  header: StandardPageHeader;
  pageState: StandardPageState;
  summaryHero: {
    eyebrow: string;
    title: string;
    subtitle?: string;
    edge: "e-b";
    glow: "g-blue";
    metrics: Array<{
      keyLabel: string;
      valueLabel: string;
      percent: number;
      tone: "healthy" | "warning" | "danger" | "neutral";
      showProgress: boolean;
    }>;
  };
  planRequiredAlert: {
    title: string;
    body: string;
    ctaLabel: string;
    to: string;
  } | null;
  hasSubscription: boolean;
  activeDevices: ReturnType<typeof getActiveDevices>;
  issuedConfig: WebAppIssueDeviceResponse | null;
  configText: string;
  configSectionRef: RefObject<HTMLDivElement>;
  deviceSummary: string;
  recommendedRoute: string;
  routeReason: RecommendedRouteReason;
  pendingConnectionCount: number;
  deviceLimit: number | null;
  trafficUsedLabel: string;
  canAddDevice: boolean;
  issueActionLabel: string;
  isAddPending: boolean;
  issueErrorMessage: string | null;
  /** True when issue failed due to device limit (show same copy as at-limit upsell + Upgrade CTA). */
  isDeviceLimitError: boolean;
  revokeId: string | null;
  setRevokeId: (id: string | null) => void;
  isRevoking: boolean;
  configBadge: StandardSectionBadge;
  activeBadge: StandardSectionBadge;
  /** Card tone for Setup section: amber when pending confirmation, else blue. */
  setupCardTone: MissionTone;
  /** Setup step for SetupCardContent: subscription | issue | pending. */
  setupStep: "subscription" | "issue" | "pending";
  showSetupCard: boolean;
  showUpgradeCta: boolean;
  upgradeTargetTo: string;
  /** Intent-specific copy for device-limit upsell (spec §15). */
  deviceLimitUpsellCopy: { title: string; body: string; ctaLabel: string } | null;
  handleIssueDevice: (deviceName?: string) => void;
  handleUpgradePlanClick: () => void;
  handleCopyConfig: () => Promise<boolean>;
  handleDownloadConfig: () => void;
  handleConfirmRevoke: () => void;
  handleReplaceDevice: (deviceId: string) => void;
  handleConfirmConnected: (deviceId: string) => void;
  handleRenameDevice: (deviceId: string, deviceName: string) => void;
  isReplacingId: string | null;
  isConfirmingId: string | null;
  isRenamePending: boolean;
  formatIssuedAt: (value: string) => string;
}

export function useDevicesPageModel(): DevicesPageModel {
  const hasToken = !!useWebappToken();
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useSession(hasToken);
  const { addToast } = useToast();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [issuedConfig, setIssuedConfig] = useState<WebAppIssueDeviceResponse | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const configSectionRef = useRef<HTMLDivElement>(null);
  const { impact, notify } = useTelegramHaptics();
  const { t, locale } = useI18n();
  const activeSub = useMemo(() => getActiveSubscription(data), [data]);
  const activeDevices = useMemo(() => getActiveDevices(data), [data]);
  const recommendedRoute = data?.routing?.recommended_route ?? "/devices";
  const routeReason = (data?.routing?.reason ?? "unknown") as RecommendedRouteReason;

  const plansQuery = useQuery<PlansResponse>({
    queryKey: [...webappQueryKeys.plans()],
    queryFn: getPlans,
    enabled: hasToken,
  });
  const usageQuery = useQuery<WebAppUsageResponse>({
    queryKey: [...webappQueryKeys.usage("7d")],
    queryFn: () => webappApi.get<WebAppUsageResponse>("/webapp/usage?range=7d"),
    enabled: hasToken && !!activeSub,
    staleTime: 60_000,
  });
  const plans = plansQuery.data?.items ?? [];
  const currentPlan = activeSub?.plan_id
    ? plans.find((plan) => plan.id === activeSub.plan_id)
    : undefined;
  const showUpsellDeviceLimit = shouldShowUpsell(currentPlan?.upsell_methods, "device_limit");
  const atDeviceLimit = Boolean(activeSub && activeDevices.length >= (activeSub.device_limit ?? 0));
  const showUpgradeCta = atDeviceLimit && showUpsellDeviceLimit;
  const upgradeTargetTo = getUpgradeCheckoutPathForDeviceLimit(plans, activeSub?.plan_id);
  const planTargetTo = getUpgradeCheckoutPath(plans, activeSub?.plan_id);
  const deviceLimitOffer = showUpgradeCta
    ? getUpgradeOfferForIntent(plans as PlanLikeForUpsell[], currentPlan, "device_limit", "devices", t)
    : null;
  const deviceLimitUpsellCopy = deviceLimitOffer
    ? { title: deviceLimitOffer.title, body: deviceLimitOffer.body, ctaLabel: deviceLimitOffer.ctaLabel }
    : null;
  useTrackScreen("devices", activeSub?.plan_id ?? null);
  const { track } = useTelemetry(activeSub?.plan_id ?? null);

  const issueMutation = useMutation({
    mutationFn: async (deviceName?: string) => {
      const response = await webappApi.post<WebAppIssueDeviceResponse>("/webapp/devices/issue", {});
      return { response, deviceName };
    },
    onSuccess: async ({ response, deviceName }) => {
      const trimmedDeviceName = deviceName?.trim();
      setIssuedConfig(response);
      if (trimmedDeviceName && response.device_id) {
        try {
          await webappApi.patch(`/webapp/devices/${response.device_id}`, { device_name: trimmedDeviceName });
        } catch {
          addToast(t("devices.toast_name_saved_later"), "info");
        }
      }
      queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
      track("config_download", { screen_name: "devices" });
      if (response.peer_created) {
        addToast(t("devices.toast_device_added"), "success");
        notify("success");
      } else {
        addToast(t("devices.toast_device_created_pending"), "info");
      }
    },
    onError: (err) => {
      const msg = getErrorMessage(err, t("devices.toast_failed_add_device"));
      addToast(msg, "error");
      notify("error");
      if (/device limit/i.test(getErrorMessage(err, ""))) {
        track("device_limit_reached", {
          screen_name: "devices",
          device_limit: activeSub?.device_limit ?? undefined,
          devices_used: activeDevices.length,
        });
      }
    },
  });

  const replaceMutation = useMutation<WebAppIssueDeviceResponse, Error, string>({
    mutationFn: async (deviceId: string) => {
      return webappApi.post<WebAppIssueDeviceResponse>(`/webapp/devices/${deviceId}/replace-with-new`);
    },
    onSuccess: (res) => {
      setIssuedConfig(res);
      queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
      track("device_issue_success", { screen_name: "devices" });
      addToast(t("devices.toast_device_replaced"), "success");
      notify("success");
    },
    onError: (err) => {
      addToast(getErrorMessage(err, t("devices.toast_replace_failed")), "error");
      notify("error");
    },
  });

  const confirmConnectedMutation = useMutation<void, Error, string>({
    mutationFn: async (deviceId: string) => {
      await webappApi.post(`/webapp/devices/${deviceId}/confirm-connected`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
      track("connect_confirmed", { screen_name: "devices" });
      addToast(t("devices.toast_connection_confirmed"), "success");
      notify("success");
    },
    onError: () => {
      addToast(t("devices.toast_confirm_failed"), "error");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async () => {
      if (!revokeId) return;
      await webappApi.post(`/webapp/devices/${revokeId}/revoke`);
    },
    onSuccess: () => {
      addToast(t("devices.toast_device_revoked"), "success");
      notify("success");
      track("device_revoked", { screen_name: "devices" });
      setRevokeId(null);
      queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
    },
    onError: () => {
      addToast(t("devices.toast_revoke_failed"), "error");
      setRevokeId(null);
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ deviceId, deviceName }: { deviceId: string; deviceName: string }) => {
      await webappApi.patch(`/webapp/devices/${deviceId}`, {
        device_name: deviceName.trim() || null,
      });
    },
    onSuccess: () => {
      addToast(t("devices.toast_rename_success"), "success");
      notify("success");
      queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
    },
    onError: () => {
      addToast(t("devices.toast_rename_failed"), "error");
    },
  });

  useEffect(() => {
    if (issuedConfig && configSectionRef.current) {
      configSectionRef.current.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "nearest",
      });
    }
  }, [issuedConfig, prefersReducedMotion]);

  const hasSubscription = Boolean(activeSub);
  const deviceLimit = activeSub?.device_limit ?? null;
  const pendingConnectionCount = activeDevices.filter((device) => {
    const status = device.status ?? "config_pending";
    return status === "config_pending" || status === "idle";
  }).length;
  const configText = issuedConfig?.config_awg ?? issuedConfig?.config ?? issuedConfig?.config_wg_obf ?? issuedConfig?.config_wg ?? "";
  const canAddDevice = Boolean(activeSub && (deviceLimit == null || activeDevices.length < deviceLimit) && isOnline);
  const issueActionLabel = "Add device";
  const issueErrorMessage = issueMutation.isError
    ? getErrorMessage(issueMutation.error, t("common.could_not_load_generic"))
    : null;
  const isDeviceLimitError =
    issueMutation.isError && /device limit/i.test(getErrorMessage(issueMutation.error, ""));
  const deviceSummary = deviceLimit != null
    ? t("devices.summary_limited", { used: activeDevices.length, limit: deviceLimit })
    : t("devices.summary_unbounded", { count: activeDevices.length });

  const summaryHeroTitle = !hasSubscription
    ? t("devices.header_title")
    : activeDevices.length === 0
      ? t("devices.empty_title")
      : t("devices.header_title");
  const summaryHeroSubtitle = !hasSubscription
    ? undefined
    : routeReason === "connection_not_confirmed"
      ? `${deviceSummary}. ${t("devices.summary_subtitle_connection_not_confirmed")}`
      : activeDevices.length === 0
        ? t("devices.summary_subtitle_no_devices")
        : `${deviceSummary}. ${t("devices.summary_subtitle_default")}`;
  const activeDeviceCount = activeDevices.length;
  const connectedDeviceCount = Math.max(0, activeDeviceCount - pendingConnectionCount);
  const capacityPercent =
    hasSubscription && deviceLimit != null && deviceLimit > 0
      ? clamp((activeDeviceCount / deviceLimit) * 100, 0, 100)
      : hasSubscription && activeDeviceCount > 0
        ? 100
        : 0;
  const capacityTone: "healthy" | "warning" | "danger" | "neutral" =
    !hasSubscription ? "neutral" : capacityPercent >= 100 ? "danger" : capacityPercent >= 80 ? "warning" : "healthy";
  const readinessPercent =
    activeDeviceCount > 0 ? clamp((connectedDeviceCount / activeDeviceCount) * 100, 0, 100) : 0;
  const readinessTone: "healthy" | "warning" | "danger" | "neutral" =
    !hasSubscription ? "neutral" : connectedDeviceCount === 0 ? "warning" : pendingConnectionCount > 0 ? "warning" : "healthy";
  const remainingSlots = deviceLimit != null ? Math.max(deviceLimit - activeDeviceCount, 0) : null;
  const remainingSlotsLabel = !hasSubscription
    ? "—"
    : remainingSlots == null
      ? t("devices.summary_unbounded", { count: activeDeviceCount })
      : `${remainingSlots}`;
  const remainingSlotsPercent =
    hasSubscription && deviceLimit != null && deviceLimit > 0
      ? clamp((Math.max(deviceLimit - activeDeviceCount, 0) / deviceLimit) * 100, 0, 100)
      : hasSubscription
        ? 100
        : 0;
  const remainingSlotsTone: "healthy" | "warning" | "danger" | "neutral" =
    !hasSubscription ? "neutral" : remainingSlots === 0 ? "danger" : remainingSlots != null && remainingSlots <= 1 ? "warning" : "healthy";

  const usageData = usageQuery.data;
  const totalTrafficBytes = useMemo(
    () =>
      (usageData?.points ?? []).reduce(
        (sum, point) => sum + (point.bytes_in ?? 0) + (point.bytes_out ?? 0),
        0,
      ),
    [usageData?.points],
  );
  const dataPercent = activeSub
    ? clamp((totalTrafficBytes / DEFAULT_USAGE_SOFT_CAP_BYTES) * 100, 0, 100)
    : 0;
  const setupMetricValue = !hasSubscription
    ? t("devices.metric_inactive")
    : activeDeviceCount === 0
      ? t("devices.empty_title")
      : pendingConnectionCount > 0
        ? t("devices.hero_metric_pending_value", { count: pendingConnectionCount })
        : t("devices.hero_metric_ready_value", { count: connectedDeviceCount });
  const trafficMetricValue = hasSubscription ? formatBytes(totalTrafficBytes, { digits: 1 }) : "—";

  const handleDownloadConfig = () => {
    if (!configText) return;
    try {
      const shortId = issuedConfig?.device_id?.slice(0, 8) || "device";
      const fileName = `vpn-config-${shortId}.conf`;
      const nav = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
        share?: (data: { files?: File[]; title?: string }) => Promise<void>;
      };
      const mimeType = "application/octet-stream";
      const file = new File([configText], fileName, { type: mimeType });
      const canUseShareWithFiles = typeof nav.share === "function" && typeof nav.canShare === "function" && nav.canShare({ files: [file] });

      if (canUseShareWithFiles) {
        void nav.share({ files: [file], title: t("devices.share_title") })
          .then(() => addToast(t("devices.share_ready"), "success"))
          .catch(() => addToast(t("devices.share_failed"), "error"));
        return;
      }

      const blob = new Blob([configText], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      track("config_download", { screen_name: "devices" });
    } catch {
      addToast(t("devices.toast_download_failed"), "error");
    }
  };

  const handleCopyConfig = async () => {
    if (!configText) return false;
    try {
      await navigator.clipboard.writeText(configText);
      notify("success");
      track("config_download", { screen_name: "devices" });
      return true;
    } catch {
      addToast(t("devices.toast_copy_failed"), "error");
      notify("error");
      return false;
    }
  };

  const handleIssueDevice = (deviceName?: string) => {
    impact("medium");
    track("device_issue_started", { screen_name: "devices" });
    issueMutation.mutate(deviceName);
  };

  const handleUpgradePlanClick = () => {
    track("upsell_clicked", { trigger: "device_limit", screen_name: "devices" });
  };

  const deviceLimitUpsellVisible = showUpgradeCta || isDeviceLimitError;
  const deviceLimitUpsellFiredRef = useRef(false);
  useEffect(() => {
    if (deviceLimitUpsellVisible && !deviceLimitUpsellFiredRef.current) {
      deviceLimitUpsellFiredRef.current = true;
      track("upsell_impression", { trigger: "device_limit", screen_name: "devices" });
    }
  }, [deviceLimitUpsellVisible, track]);

  const header: StandardPageHeader = {
    title: t("devices.header_title"),
    subtitle: t("devices.header_subtitle"),
  };

  const pageState: StandardPageState = !hasToken
    ? { status: "empty", title: t("common.session_missing_title") }
    : error
      ? {
          status: "error",
          title: t("common.could_not_load_title"),
          message: t("common.could_not_load_devices"),
          onRetry: () => queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] }),
        }
      : isLoading
        ? { status: "loading" }
        : { status: "ready" };

  return {
    header,
    pageState,
    summaryHero: {
      eyebrow: t("devices.summary_eyebrow"),
      title: summaryHeroTitle,
      subtitle: summaryHeroSubtitle,
      edge: "e-b",
      glow: "g-blue",
      metrics: [
        {
          keyLabel: t("devices.hero_metric_capacity_label"),
          valueLabel: hasSubscription ? deviceSummary : "—",
          percent: capacityPercent,
          tone: capacityTone,
          showProgress: hasSubscription,
        },
        {
          keyLabel: t("devices.hero_metric_setup_label"),
          valueLabel: setupMetricValue,
          percent: readinessPercent,
          tone: readinessTone,
          showProgress: hasSubscription,
        },
        {
          keyLabel: hasSubscription ? t("devices.hero_metric_traffic_label") : t("devices.summary_slots_left"),
          valueLabel: hasSubscription ? trafficMetricValue : remainingSlotsLabel,
          percent: hasSubscription ? dataPercent : remainingSlotsPercent,
          tone: hasSubscription ? "healthy" : remainingSlotsTone,
          showProgress: hasSubscription,
        },
      ],
    },
    planRequiredAlert: !hasSubscription
      ? {
          title: t("devices.summary_title_plan_required"),
          body: t("devices.summary_subtitle_plan_required"),
          ctaLabel: t("home.primary_choose_plan"),
          to: planTargetTo,
        }
      : null,
    hasSubscription,
    activeDevices,
    issuedConfig,
    configText,
    configSectionRef,
    deviceSummary,
    recommendedRoute,
    routeReason,
    pendingConnectionCount,
    deviceLimit,
    trafficUsedLabel: trafficMetricValue,
    canAddDevice,
    issueActionLabel,
    isAddPending: issueMutation.isPending,
    issueErrorMessage,
    isDeviceLimitError,
    revokeId,
    setRevokeId,
    isRevoking: revokeMutation.isPending,
    configBadge: { tone: "amber", label: "Sensitive" },
    activeBadge: { tone: "neutral", label: `${activeDevices.length} active`, emphasizeNumeric: true },
    setupCardTone: hasSubscription && activeDevices.length > 0 ? "amber" : "blue",
    setupStep: !hasSubscription ? "subscription" : activeDevices.length === 0 ? "issue" : "pending",
    showSetupCard:
      !hasSubscription ||
      activeDevices.length === 0 ||
      (pendingConnectionCount > 0 && !issuedConfig),
    showUpgradeCta,
    upgradeTargetTo,
    deviceLimitUpsellCopy,
    handleIssueDevice,
    handleUpgradePlanClick,
    handleCopyConfig,
    handleDownloadConfig,
    handleConfirmRevoke: () => revokeMutation.mutate(),
    handleReplaceDevice: (deviceId: string) => {
      impact("medium");
      replaceMutation.mutate(deviceId);
    },
    handleConfirmConnected: (deviceId: string) => {
      impact("medium");
      confirmConnectedMutation.mutate(deviceId);
    },
    handleRenameDevice: (deviceId: string, deviceName: string) => {
      impact("light");
      renameMutation.mutate({ deviceId, deviceName });
    },
    isReplacingId: replaceMutation.isPending && replaceMutation.variables != null ? replaceMutation.variables : null,
    isConfirmingId: confirmConnectedMutation.isPending && confirmConnectedMutation.variables != null ? confirmConnectedMutation.variables : null,
    isRenamePending: renameMutation.isPending,
    formatIssuedAt: (value) => formatIssuedAt(value, locale),
  };
}
