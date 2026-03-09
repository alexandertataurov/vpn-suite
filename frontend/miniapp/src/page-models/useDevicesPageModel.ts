import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WebAppIssueDeviceResponse } from "@vpn-suite/shared";
import { getPlans } from "@/api";
import { useWebappToken, webappApi } from "@/api/client";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSession } from "@/hooks/useSession";
import { useTelegramHaptics } from "@/hooks/useTelegramHaptics";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useTrackScreen } from "@/hooks/useTrackScreen";
import { useToast } from "@/design-system";
import { webappQueryKeys } from "@/lib/query-keys/webapp.query-keys";
import { getErrorMessage } from "@/lib/utils/error";
import type { MissionTone } from "@/design-system";
import type { StandardPageHeader, StandardPageState, StandardSectionBadge } from "./types";
import type { PlansResponse } from "@/api";
import type { RecommendedRouteReason } from "./usePlanPageModel";
import {
  getActiveDevices,
  getActiveSubscription,
  getUpgradeCheckoutPathForDeviceLimit,
  shouldShowUpsell,
} from "./helpers";
import { getUpgradeOfferForIntent, type PlanLikeForUpsell } from "./upsell";

function formatIssuedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export interface DevicesPageModel {
  header: StandardPageHeader;
  pageState: StandardPageState;
  summaryHero: { eyebrow: string; title: string; subtitle?: string; edge: "e-b"; glow: "g-blue" };
  hasSubscription: boolean;
  activeDevices: ReturnType<typeof getActiveDevices>;
  issuedConfig: WebAppIssueDeviceResponse | null;
  configText: string;
  configSectionRef: RefObject<HTMLDivElement>;
  deviceSummary: string;
  recommendedRoute: string;
  routeReason: RecommendedRouteReason;
  pendingConnectionCount: number;
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
  /** Chip for Setup section header: tone and label. */
  setupChip: { tone: MissionTone; label: string };
  showSetupCard: boolean;
  showUpgradeCta: boolean;
  upgradeTargetTo: string;
  /** Intent-specific copy for device-limit upsell (spec §15). */
  deviceLimitUpsellCopy: { title: string; body: string; ctaLabel: string } | null;
  handleIssueDevice: () => void;
  handleUpgradePlanClick: () => void;
  handleCopyConfig: () => Promise<void>;
  handleDownloadConfig: () => void;
  handleConfirmRevoke: () => void;
  handleReplaceDevice: (deviceId: string) => void;
  handleConfirmConnected: (deviceId: string) => void;
  isReplacingId: string | null;
  isConfirmingId: string | null;
  formatIssuedAt: (value: string) => string;
}

export function useDevicesPageModel(): DevicesPageModel {
  const hasToken = !!useWebappToken();
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useSession(hasToken);
  const { addToast } = useToast();
  const [issuedConfig, setIssuedConfig] = useState<WebAppIssueDeviceResponse | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const configSectionRef = useRef<HTMLDivElement>(null);
  const { impact, notify } = useTelegramHaptics();
  const activeSub = getActiveSubscription(data);
  const activeDevices = getActiveDevices(data);
  const recommendedRoute = data?.routing?.recommended_route ?? "/devices";
  const routeReason = (data?.routing?.reason ?? "unknown") as RecommendedRouteReason;

  const plansQuery = useQuery<PlansResponse>({
    queryKey: [...webappQueryKeys.plans()],
    queryFn: getPlans,
    enabled: hasToken,
  });
  const plans = plansQuery.data?.items ?? [];
  const currentPlan = activeSub?.plan_id
    ? plans.find((plan) => plan.id === activeSub.plan_id)
    : undefined;
  const showUpsellDeviceLimit = shouldShowUpsell(currentPlan?.upsell_methods, "device_limit");
  const atDeviceLimit = Boolean(activeSub && activeDevices.length >= (activeSub.device_limit ?? 0));
  const showUpgradeCta = atDeviceLimit && showUpsellDeviceLimit;
  const upgradeTargetTo = getUpgradeCheckoutPathForDeviceLimit(plans, activeSub?.plan_id);
  const deviceLimitOffer = showUpgradeCta
    ? getUpgradeOfferForIntent(plans as PlanLikeForUpsell[], currentPlan, "device_limit", "devices")
    : null;
  const deviceLimitUpsellCopy = deviceLimitOffer
    ? { title: deviceLimitOffer.title, body: deviceLimitOffer.body, ctaLabel: deviceLimitOffer.ctaLabel }
    : null;
  useTrackScreen("devices", activeSub?.plan_id ?? null);
  const { track } = useTelemetry(activeSub?.plan_id ?? null);

  const issueMutation = useMutation({
    mutationFn: () => webappApi.post<WebAppIssueDeviceResponse>("/webapp/devices/issue", {}),
    onSuccess: (res) => {
      setIssuedConfig(res);
      queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
      track("config_download", { screen_name: "devices" });
      if (res.peer_created) {
        addToast("Device added and activated", "success");
        notify("success");
      } else {
        addToast("Device created. Server sync pending. If VPN fails, retry later or contact support.", "info");
      }
    },
    onError: (err) => {
      const msg = getErrorMessage(err, "Failed to add device");
      addToast(msg, "error");
      notify("error");
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
      addToast("Device replaced. New config ready.", "success");
      notify("success");
    },
    onError: (err) => {
      addToast(getErrorMessage(err, "Failed to replace device"), "error");
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
      addToast("Connection confirmed", "success");
      notify("success");
    },
    onError: () => {
      addToast("Could not confirm connection", "error");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async () => {
      if (!revokeId) return;
      await webappApi.post(`/webapp/devices/${revokeId}/revoke`);
    },
    onSuccess: () => {
      addToast("Device revoked", "success");
      notify("success");
      track("device_revoked", { screen_name: "devices" });
      setRevokeId(null);
      queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
    },
    onError: () => {
      addToast("Failed to revoke device", "error");
      setRevokeId(null);
    },
  });

  useEffect(() => {
    if (issuedConfig && configSectionRef.current) {
      configSectionRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [issuedConfig]);

  const hasSubscription = Boolean(activeSub);
  const deviceLimit = activeSub?.device_limit ?? null;
  const pendingConnectionCount = activeDevices.filter((device) => {
    const status = device.status ?? "config_pending";
    return status === "config_pending" || status === "idle";
  }).length;
  const configText = issuedConfig?.config_awg ?? issuedConfig?.config ?? issuedConfig?.config_wg_obf ?? issuedConfig?.config_wg ?? "";
  const canAddDevice = Boolean(activeSub && (deviceLimit == null || activeDevices.length < deviceLimit) && isOnline);
  const issueActionLabel = activeDevices.length === 0 ? "Issue first device" : "Add device";
  const issueErrorMessage = issueMutation.isError ? getErrorMessage(issueMutation.error, "Try again or contact support.") : null;
  const isDeviceLimitError =
    issueMutation.isError && /device limit/i.test(getErrorMessage(issueMutation.error, ""));
  const deviceSummary = deviceLimit != null
    ? `${activeDevices.length} / ${deviceLimit} active`
    : `${activeDevices.length} device${activeDevices.length === 1 ? "" : "s"}`;

  const summaryHeroTitle = !hasSubscription
    ? "Subscription required"
    : activeDevices.length === 0
      ? "No devices issued"
      : deviceSummary;
  const summaryHeroSubtitle = !hasSubscription
    ? "Activate a plan before issuing a VPN config."
    : routeReason === "connection_not_confirmed"
      ? "Import your config, connect in the VPN app, then confirm the connection."
      : activeDevices.length === 0
        ? "Issue your first config to start secure access."
        : "Manage issued configs, connection confirmation, and device replacement.";

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
        void nav.share({ files: [file], title: "VPN config" })
          .then(() => addToast("Config ready to save/share", "success"))
          .catch(() => addToast("Could not open share sheet. Try download or copy instead.", "error"));
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
    } catch {
      addToast("Could not download config. Please copy it manually.", "error");
    }
  };

  const handleCopyConfig = async () => {
    if (!configText) return;
    try {
      await navigator.clipboard.writeText(configText);
      addToast("Config copied to clipboard", "success");
    } catch {
      addToast("Could not copy config. Please select and copy manually.", "error");
    }
  };

  const handleIssueDevice = () => {
    impact("medium");
    track("device_issue_started", { screen_name: "devices" });
    issueMutation.mutate();
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
    title: "Devices & Access",
    subtitle: "Add and manage VPN configs",
  };

  const pageState: StandardPageState = !hasToken
    ? { status: "empty", title: "Session missing" }
    : error
      ? {
          status: "error",
          title: "Could not load devices",
          message: "We could not load your devices. Please try again or contact support.",
          onRetry: () => queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] }),
        }
      : isLoading
        ? { status: "loading" }
        : { status: "ready" };

  return {
    header,
    pageState,
    summaryHero: {
      eyebrow: "Devices",
      title: summaryHeroTitle,
      subtitle: summaryHeroSubtitle,
      edge: "e-b",
      glow: "g-blue",
    },
    hasSubscription,
    activeDevices,
    issuedConfig,
    configText,
    configSectionRef,
    deviceSummary,
    recommendedRoute,
    routeReason,
    pendingConnectionCount,
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
    setupChip: {
      tone: !hasSubscription ? "blue" : "amber",
      label: !hasSubscription ? "Step 1" : activeDevices.length === 0 ? "Step 2" : pendingConnectionCount > 0 ? `${pendingConnectionCount} device waiting` : "Pending",
    },
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
    isReplacingId: replaceMutation.isPending && replaceMutation.variables != null ? replaceMutation.variables : null,
    isConfirmingId: confirmConnectedMutation.isPending && confirmConnectedMutation.variables != null ? confirmConnectedMutation.variables : null,
    formatIssuedAt,
  };
}
