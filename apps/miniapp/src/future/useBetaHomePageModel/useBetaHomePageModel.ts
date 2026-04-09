import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type {
  WebAppIssueDeviceResponse,
  WebAppReferralMyLinkResponse,
  WebAppUsageResponse,
} from "@vpn-suite/shared";
import { getPlans, type PlanItem, type PlansResponse } from "@/api";
import { useWebappToken, webappApi } from "@/api/client";
import { telegramBotUsername } from "@/config/env";
import { useToast, type MissionAlertTone, type MissionPrimaryButtonTone, type MissionTone, type PageHeaderBadgeTone } from "@/design-system";
import { useBootstrapContext } from "@/bootstrap/context";
import {
  useOnlineStatus,
  useSession,
  useTelegramHaptics,
  useTelemetry,
  useTrackScreen,
} from "@/hooks";
import { webappQueryKeys, formatBytes, getErrorMessage } from "@/lib";
import type { StandardPageState } from "./types";
import {
  getActiveDevices,
  getActiveSubscription,
  getLatestActiveDevice,
  getLiveConnection,
  getPrimarySubscription,
  hasConfirmedConnection,
} from "./helpers";

export type BetaHomeState =
  | "welcome"
  | "plan_selection"
  | "device_setup"
  | "import_guide"
  | "ready"
  | "expired_or_paused";

export type HomeFlowActionKind =
  | "open_vpn_app"
  | "download_app"
  | "view_plans"
  | "issue_device"
  | "download_config"
  | "view_devices"
  | "restore_access"
  | "manage_plan"
  | "continue_setup"
  | "confirm_import"
  | "open_referral"
  | "open_settings";

export interface HomeFlowAction {
  kind: HomeFlowActionKind;
  label: string;
  tone?: MissionPrimaryButtonTone;
}

export interface HomeFlowContext {
  key: string;
  headerSubtitle: string;
  heroTone: MissionTone;
  heroBadge: {
    label: string;
    tone: PageHeaderBadgeTone;
    pulse?: boolean;
  };
  heroTitle: string;
  heroBody: string;
  heroAlert: {
    tone: MissionAlertTone;
    title: string;
    message: string;
  } | null;
  primaryAction?: HomeFlowAction;
  secondaryAction?: HomeFlowAction;
  plansSectionDescription?: string;
  devicesSectionTitle: string;
  devicesSectionDescription?: string;
  importSectionDescription: string;
  helpDescription: string;
  helpItems: string[];
}

export interface HomeSummaryStatus {
  label: string;
  variant: "active" | "pending" | "info" | "offline" | "blocked";
}

export interface HomeSummaryMetaItem {
  label: string;
  value: string;
  isStatus?: boolean;
  variant?: "active" | "pending" | "info" | "offline";
}

export interface HomeSetupItem {
  id: string;
  label: string;
  description: string;
  state: "complete" | "current" | "upcoming";
}

export interface HomeNavigationItem {
  title: string;
  description: string;
}

export interface HomePageContent {
  accessStatus: HomeSummaryStatus;
  configStatus: HomeSummaryStatus;
  heroStats: Array<{ label: string; value: string }>;
  heroMeta: HomeSummaryMetaItem[];
  setupItems: HomeSetupItem[];
  setupCardTitle: string;
  setupCardSubtitle: string;
  nextSectionTitle: string;
  nextSectionDescription: string;
  planItem: HomeNavigationItem;
  devicesItem: HomeNavigationItem;
  setupItem: HomeNavigationItem;
  downloadItem: HomeNavigationItem;
}

function buildHomePageContent(params: {
  activeSub: unknown;
  activeDevicesCount: number;
  deviceLimit: number | null;
  latestDeviceName: string;
  currentPlanName: string;
  primarySubValidUntil?: string | null;
  connectionConfirmed: boolean;
  configText: string;
  isLiveConnected: boolean;
  needsRestore: boolean;
  hasVpnAppPayload: boolean;
}): HomePageContent {
  const {
    activeSub,
    activeDevicesCount,
    deviceLimit,
    latestDeviceName,
    currentPlanName,
    primarySubValidUntil,
    connectionConfirmed,
    configText,
    isLiveConnected,
    needsRestore,
    hasVpnAppPayload,
  } = params;

  const deviceMeta = deviceLimit == null
    ? `${activeDevicesCount} devices`
    : `${activeDevicesCount}/${deviceLimit} devices`;
  const latestDeviceLabel = activeDevicesCount > 0 ? latestDeviceName : "No devices yet";
  const configStatus: HomeSummaryStatus = connectionConfirmed
    ? { label: "Imported", variant: "active" }
    : configText
      ? { label: "Ready to import", variant: "pending" }
      : activeSub
        ? { label: "Needs setup", variant: "offline" }
        : { label: "Not ready", variant: "offline" };
  const accessStatus: HomeSummaryStatus = needsRestore
    ? { label: "Access paused", variant: "blocked" }
    : !activeSub
      ? { label: "Choose a plan", variant: "info" }
      : isLiveConnected
        ? { label: "Connected now", variant: "active" }
        : connectionConfirmed
          ? { label: "Access active", variant: "active" }
          : activeDevicesCount > 0
            ? { label: "Setup in progress", variant: "pending" }
            : { label: "Access active", variant: "active" };
  const heroStats = [
    { label: "Plan", value: activeSub ? currentPlanName : "None" },
    { label: "Devices", value: String(activeDevicesCount) },
    {
      label: "Status",
      value: !activeSub
        ? "Not ready"
        : isLiveConnected
          ? "Connected now"
          : connectionConfirmed
            ? "Ready"
            : activeDevicesCount > 0
              ? "In progress"
              : "Not ready",
    },
  ];
  const heroMeta: HomeSummaryMetaItem[] = [
    { label: "Config", value: configStatus.label, variant: configStatus.variant === "blocked" ? "offline" : configStatus.variant, isStatus: true },
    { label: "Latest device", value: activeDevicesCount > 0 ? latestDeviceLabel : "None", isStatus: false },
  ];
  const setupItems: HomeSetupItem[] = [
    {
      id: "plan",
      label: "Choose plan",
      description: activeSub ? currentPlanName : "Pay in Telegram to activate access.",
      state: activeSub ? "complete" : "current",
    },
    {
      id: "device",
      label: "Add device",
      description: activeDevicesCount > 0 ? latestDeviceLabel : "Create your first device and config.",
      state: activeSub
        ? activeDevicesCount > 0
          ? "complete"
          : "current"
        : "upcoming",
    },
    {
      id: "config",
      label: "Get config",
      description: configText ? "Config ready to import." : "Open Devices to get your config.",
      state: activeDevicesCount > 0
        ? configText
          ? "complete"
          : "current"
        : "upcoming",
    },
    {
      id: "connect",
      label: "Connect in AmneziaVPN",
      description: connectionConfirmed ? "Setup confirmed." : "Import the config and connect in AmneziaVPN.",
      state: connectionConfirmed
        ? "complete"
        : configText
          ? "current"
          : "upcoming",
    },
  ];

  return {
    accessStatus,
    configStatus,
    heroStats,
    heroMeta,
    setupItems,
    setupCardTitle: "Finish setup",
    setupCardSubtitle: configText
      ? "Import the config in AmneziaVPN and connect there."
      : "Choose a plan, then add a device and get its config.",
    nextSectionTitle: connectionConfirmed ? "Quick access" : "Next",
    nextSectionDescription: connectionConfirmed
      ? "Open the area you need."
      : "Go to the next screen for the active task.",
    planItem: {
      title: activeSub ? "Plan & billing" : "Choose plan",
      description: activeSub
        ? `${currentPlanName}${primarySubValidUntil ? ` · Renewal ${new Intl.DateTimeFormat(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }).format(new Date(primarySubValidUntil))}` : ""}`
        : "Review your plan, then pay in Telegram.",
    },
    devicesItem: {
      title: activeDevicesCount > 0 ? "Devices" : "Add your first device",
      description: activeDevicesCount > 0
        ? `${deviceMeta} · Latest: ${latestDeviceLabel}`
        : activeSub
          ? "Open Devices to add your first device and get its config."
          : "Choose a plan first, then open Devices.",
    },
    setupItem: {
      title: connectionConfirmed ? "Connect in AmneziaVPN" : "Setup status",
      description: connectionConfirmed
        ? "Your access is ready. Open AmneziaVPN when you want to connect."
        : configText
          ? "Import the config in AmneziaVPN, connect there, then confirm setup if needed."
          : "AmneziaVPN handles the VPN connection after you add a device.",
    },
    downloadItem: {
      title: hasVpnAppPayload ? "Open AmneziaVPN" : "Get config",
      description: hasVpnAppPayload
        ? "Open AmneziaVPN with your latest setup."
        : "Open Devices to copy or download your latest config.",
    },
  };
}

export function buildHomeFlowContext(params: {
  state: BetaHomeState;
  routeReason: string;
  hasConfig: boolean;
  activeDevicesCount: number;
  hasVpnAppPayload: boolean;
}): HomeFlowContext {
  const { state, routeReason, hasConfig, activeDevicesCount, hasVpnAppPayload } = params;

  if (state === "welcome") {
    return {
      key: "welcome",
      headerSubtitle: "Buy access here, then connect in AmneziaVPN.",
      heroTone: "blue",
      heroBadge: { label: "Start", tone: "info" },
      heroTitle: "Access starts here",
      heroBody: "Choose a plan, then add a device and import its config in AmneziaVPN.",
      heroAlert: null,
      primaryAction: { kind: "view_plans", label: "Choose plan" },
      secondaryAction: { kind: "restore_access", label: "Restore access" },
      plansSectionDescription: "Review your plan, then pay in Telegram.",
      devicesSectionTitle: "Your devices",
      importSectionDescription: "Open AmneziaVPN and import your config there after you add a device.",
      helpDescription: "Manage access here. Connect in AmneziaVPN.",
      helpItems: [
        "Choose a plan here.",
        "Add a device to get your config.",
        "Connect in AmneziaVPN.",
      ],
    };
  }

  if (state === "plan_selection") {
    return {
      key: "plan_selection",
      headerSubtitle: "Choose a plan to activate access.",
      heroTone: "blue",
      heroBadge: { label: "Step 1", tone: "info" },
      heroTitle: "Access starts here",
      heroBody: "Choose a plan, then add a device and import its config in AmneziaVPN.",
      heroAlert: null,
      primaryAction: { kind: "view_plans", label: "Choose plan" },
      plansSectionDescription: "Review your plan, then pay in Telegram.",
      devicesSectionTitle: "Your devices",
      importSectionDescription: "Open AmneziaVPN and import your config there after you add a device.",
      helpDescription: "Manage access here. Connect in AmneziaVPN.",
      helpItems: [
        "Choose one plan.",
        "Add a device after payment.",
        "Connect in AmneziaVPN.",
      ],
    };
  }

  if (state === "device_setup") {
    return {
      key: "device_setup",
      headerSubtitle: "Access is active. Add a device next.",
      heroTone: "blue",
      heroBadge: { label: "Step 2", tone: "warning" },
      heroTitle: "Add your first device",
      heroBody: "Open Devices and create your first config.",
      heroAlert: null,
      primaryAction: { kind: "view_devices", label: "Open Devices" },
      devicesSectionTitle: "Add your first device",
      importSectionDescription: "Open AmneziaVPN and import your config there after you add a device.",
      helpDescription: "Manage access here. Connect in AmneziaVPN.",
      helpItems: [
        "Open Devices.",
        "Add a device and get its config.",
        "Import it in AmneziaVPN.",
      ],
    };
  }

  if (state === "import_guide") {
    const heroTitle = "Connect in AmneziaVPN";
    const heroBody = hasConfig
      ? "Import your config in AmneziaVPN, connect there, then return here."
      : "Open Devices and add a device if you still need a config.";

    return {
      key: "import_guide",
      headerSubtitle: "Import your config in AmneziaVPN, connect there, then return here.",
      heroTone: "green",
      heroBadge: { label: "Step 3", tone: "success", pulse: hasConfig },
      heroTitle,
      heroBody,
      heroAlert: null,
      primaryAction: hasConfig
        ? {
          kind: hasVpnAppPayload ? "open_vpn_app" : "view_devices",
          label: hasVpnAppPayload ? "Open AmneziaVPN" : "Open Devices",
        }
        : { kind: "view_devices", label: "Open Devices" },
      secondaryAction: hasConfig ? { kind: "confirm_import", label: "Confirm setup" } : undefined,
      devicesSectionTitle: activeDevicesCount > 0 ? "Your devices" : "Add your first device",
      devicesSectionDescription:
        activeDevicesCount > 0 ? "Use the latest device config with AmneziaVPN." : undefined,
      importSectionDescription: hasConfig
        ? "Import the config in AmneziaVPN and connect there."
        : "Open Devices, add a device, then import its config in AmneziaVPN.",
      helpDescription: "Manage access here. Connect in AmneziaVPN.",
      helpItems: [
        "Get the latest config from Devices.",
        "Import the config in AmneziaVPN.",
        "Return here after setup if needed.",
      ],
    };
  }

  if (state === "expired_or_paused") {
    if (routeReason === "paused_access") {
      return {
        key: "paused_access",
        headerSubtitle: "Access is paused.",
        heroTone: "amber",
        heroBadge: { label: "Paused", tone: "warning" },
        heroTitle: "Access is paused",
        heroBody: "Restore billing before you connect again in AmneziaVPN.",
        heroAlert: {
          tone: "warning",
          title: "Subscription paused",
          message: "Open settings if you need billing details, support, or account actions.",
        },
        primaryAction: { kind: "open_settings", label: "Open settings" },
        secondaryAction: { kind: "view_plans", label: "View plans" },
        plansSectionDescription: "Choose a plan only if you want to switch access instead of restoring it.",
        devicesSectionTitle: "Your devices",
        importSectionDescription: "Open AmneziaVPN and import your config there after access is restored.",
        helpDescription: "Open settings for billing details, FAQ, and support.",
        helpItems: [
          "Access is paused until billing is restored.",
          "Existing configs may stop working while access stays paused.",
          "Use settings for billing, FAQ, and support.",
        ],
      };
    }

    const isGrace = routeReason === "grace" || routeReason === "expired_with_grace";
    return {
      key: isGrace ? "grace" : "expired",
      headerSubtitle: isGrace
        ? "Grace period is active."
        : "Access needs attention.",
      heroTone: "amber",
      heroBadge: { label: isGrace ? "Grace" : "Expired", tone: "warning" },
      heroTitle: isGrace ? "Restore access before grace ends" : "Restore access",
      heroBody: "Renew billing here before you continue in AmneziaVPN.",
      heroAlert: {
        tone: "warning",
        title: isGrace ? "Grace period active" : "Access expired",
        message: isGrace
          ? "Restore billing soon to keep using the same access without interruption."
          : "Restore access here or open settings if you need billing help.",
      },
      primaryAction: { kind: "restore_access", label: "Restore access", tone: "warning" },
      secondaryAction: { kind: "open_settings", label: "Open settings" },
      plansSectionDescription: "You can restore the same access or choose a different plan below.",
      devicesSectionTitle: "Your devices",
      importSectionDescription: "Open AmneziaVPN and import your config there after access is restored.",
      helpDescription: "Open settings for billing changes, FAQ, and support.",
      helpItems: [
        "Restore billing here to keep the same access.",
        "AmneziaVPN still handles the actual connection.",
        "Use settings for billing, FAQ, and support.",
      ],
    };
  }

  if (routeReason === "cancelled_at_period_end") {
    return {
      key: "cancelled_at_period_end",
      headerSubtitle: "Access is active. Renewal is off.",
      heroTone: "amber",
      heroBadge: { label: "Renewal off", tone: "warning" },
      heroTitle: "Access stays active until period end",
      heroBody: "Your current devices keep working for now. Open settings if you want renewal back on.",
      heroAlert: {
        tone: "info",
        title: "Billing status",
        message: "No setup step is blocked right now, but access will stop at the end of the paid period.",
      },
      primaryAction: { kind: "open_settings", label: "Open settings" },
      devicesSectionTitle: "Your devices",
      devicesSectionDescription:
        activeDevicesCount > 0 ? "Manage configs for the devices you use with AmneziaVPN." : undefined,
      importSectionDescription: "Open AmneziaVPN and import your config there after you add a device.",
      helpDescription: "Open settings for renewal, FAQ, and account actions.",
      helpItems: [
        "Your access is still active until the current period ends.",
        "Manage renewal in settings if you want access to continue automatically.",
        "AmneziaVPN still handles the actual connection.",
      ],
    };
  }

  return {
    key: "connected_user",
    headerSubtitle: "Your access is ready.",
    heroTone: "green",
    heroBadge: { label: "Active", tone: "success", pulse: true },
    heroTitle: "Access is ready",
    heroBody: hasVpnAppPayload
      ? "Manage access here. Connect in AmneziaVPN."
      : "Manage access here. Review your latest device, then connect in AmneziaVPN.",
    heroAlert: null,
    primaryAction: hasVpnAppPayload
      ? { kind: "open_vpn_app", label: "Open AmneziaVPN" }
      : { kind: "view_devices", label: "Open Devices" },
    secondaryAction: undefined,
    devicesSectionTitle: "Your devices",
    devicesSectionDescription:
      activeDevicesCount > 0 ? "Manage configs for the devices you use with AmneziaVPN." : undefined,
    importSectionDescription: "Open AmneziaVPN and import your config there after you add a device.",
    helpDescription: "Manage access here. Connect in AmneziaVPN.",
    helpItems: [
      "Manage access and device configs here.",
      "Connect in AmneziaVPN.",
      "Open settings for billing and support.",
    ],
  };
}

function sortPlans(plans: PlanItem[]): PlanItem[] {
  return [...plans].sort((a, b) => {
    const orderA = a.display_order ?? 999_999;
    const orderB = b.display_order ?? 999_999;
    if (orderA !== orderB) return orderA - orderB;
    const priceDelta = Number(a.price_amount) - Number(b.price_amount);
    if (priceDelta !== 0) return priceDelta;
    return a.duration_days - b.duration_days;
  });
}

function formatPlanDuration(durationDays: number): string {
  if (durationDays >= 365) return "yearly";
  if (durationDays >= 30) return "monthly";
  if (durationDays === 7) return "weekly";
  return `${durationDays} days`;
}

function formatPlanName(plan: PlanItem | null): string {
  const raw = (plan?.name ?? "").trim();
  if (raw) return raw;
  if (!plan) return "No plan";
  return `${formatPlanDuration(plan.duration_days)} plan`;
}

function resolveDeviceDraft(): string {
  if (typeof navigator === "undefined") return "My device";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("iphone") || ua.includes("ipad")) return "My iPhone";
  if (ua.includes("android")) return "My Android";
  if (ua.includes("mac")) return "My Mac";
  if (ua.includes("windows")) return "My PC";
  return "My device";
}

export function useBetaHomePageModel() {
  const hasToken = !!useWebappToken();
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { impact, notify } = useTelegramHaptics();
  const { track } = useTelemetry(null);
  const { phase, onboardingStep, setOnboardingStep, completeOnboarding } = useBootstrapContext();
  const { data: session, isLoading, error } = useSession(hasToken);
  const activeSub = getActiveSubscription(session);
  const primarySub = getPrimarySubscription(session);
  const activeDevices = getActiveDevices(session);
  const latestActiveDevice = getLatestActiveDevice(session);
  const liveConnection = getLiveConnection(session);
  const hasConfirmedSetup = hasConfirmedConnection(session);
  const [issuedConfig, setIssuedConfig] = useState<WebAppIssueDeviceResponse | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [isImportedAcknowledged, setIsImportedAcknowledged] = useState(hasConfirmedSetup);
  useTrackScreen("home", primarySub?.plan_id ?? null);

  const plansQuery = useQuery<PlansResponse>({
    queryKey: [...webappQueryKeys.plans()],
    queryFn: getPlans,
    enabled: hasToken,
  });
  const referralQuery = useQuery<WebAppReferralMyLinkResponse>({
    queryKey: [...webappQueryKeys.referralLink()],
    queryFn: () => webappApi.get<WebAppReferralMyLinkResponse>("/webapp/referral/my-link"),
    enabled: hasToken && (Boolean(activeSub) || hasConfirmedSetup),
  });

  const usageQuery = useQuery<WebAppUsageResponse>({
    queryKey: [...webappQueryKeys.usage("7d")],
    queryFn: () => webappApi.get<WebAppUsageResponse>("/webapp/usage?range=7d"),
    enabled: hasToken && !!activeSub,
    staleTime: 60_000,
  });

  const plans = useMemo(() => sortPlans(plansQuery.data?.items ?? []).slice(0, 3), [plansQuery.data?.items]);
  const currentPlan = useMemo(
    () => plansQuery.data?.items?.find((plan) => plan.id === (primarySub?.plan_id ?? activeSub?.plan_id)),
    [activeSub?.plan_id, plansQuery.data?.items, primarySub?.plan_id],
  );
  const configText =
    issuedConfig?.config_awg ??
    issuedConfig?.config ??
    issuedConfig?.config_wg_obf ??
    issuedConfig?.config_wg ??
    "";
  const latestDeviceDelivery = session?.latest_device_delivery ?? null;
  const amneziaVpnKey =
    issuedConfig?.amnezia_vpn_key ??
    latestDeviceDelivery?.amnezia_vpn_key ??
    null;
  const configDeviceId = issuedConfig?.device_id ?? null;
  const deviceLimit = activeSub?.device_limit ?? primarySub?.device_limit ?? currentPlan?.device_limit ?? null;
  const currentPlanName = formatPlanName(currentPlan ?? null);
  const currentPlanDuration = currentPlan ? formatPlanDuration(currentPlan.duration_days) : "not started";
  const canAddDevice = Boolean(activeSub && isOnline && (deviceLimit == null || activeDevices.length < deviceLimit));
  const profileName =
    (session?.user?.display_name ?? "").trim() ||
    "Guest";
  const profileInitial = profileName.charAt(0).toUpperCase() || "G";
  const profilePhotoUrl = (session?.user?.photo_url ?? "").trim() || undefined;
  const connectionConfirmed = hasConfirmedSetup || isImportedAcknowledged;
  const needsRestore =
    !activeSub &&
    !!primarySub &&
    (primarySub.access_status === "grace" ||
      primarySub.access_status === "paused" ||
      (primarySub.subscription_status ?? primarySub.status) === "expired");
  const isOnboarding = phase === "onboarding";
  const state: BetaHomeState = needsRestore
    ? "expired_or_paused"
    : isOnboarding && onboardingStep <= 0 && !activeSub
      ? "welcome"
      : !activeSub
        ? "plan_selection"
        : activeDevices.length === 0
          ? "device_setup"
          : !connectionConfirmed || issuedConfig != null || isOnboarding
            ? "import_guide"
            : "ready";
  const pageState: StandardPageState = !hasToken
    ? { status: "empty", title: "Session missing" }
    : error || plansQuery.error
      ? {
        status: "error",
        title: "Could not load your VPN access",
        message: "Please try again.",
        onRetry: () => {
          void queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
          void queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.plans()] });
        },
      }
      : isLoading || plansQuery.isLoading
        ? { status: "loading" }
        : { status: "ready" };
  const routeReason = (session?.routing?.reason ?? "unknown") as string;
  const referralPayload = referralQuery.data?.payload ?? "";
  const botUsername = (referralQuery.data?.bot_username ?? "").trim() || telegramBotUsername;
  const shareUrl = referralPayload && botUsername ? `https://t.me/${botUsername}?startapp=${referralPayload}` : "";
  const flowContext = useMemo(() => buildHomeFlowContext({
    state,
    routeReason,
    hasConfig: Boolean(configText),
    activeDevicesCount: activeDevices.length,
    hasVpnAppPayload: Boolean(amneziaVpnKey),
  }), [activeDevices.length, amneziaVpnKey, configText, routeReason, state]);
  const homePageContent = useMemo(() => buildHomePageContent({
    activeSub,
    activeDevicesCount: activeDevices.length,
    deviceLimit,
    latestDeviceName: latestActiveDevice?.device_name ?? "Not added",
    currentPlanName,
    primarySubValidUntil: primarySub?.valid_until ?? null,
    connectionConfirmed,
    configText,
    isLiveConnected: liveConnection?.status === "connected",
    needsRestore,
    hasVpnAppPayload: Boolean(amneziaVpnKey),
  }), [
    activeDevices.length,
    activeSub,
    amneziaVpnKey,
    configText,
    connectionConfirmed,
    currentPlanName,
    deviceLimit,
    latestActiveDevice?.device_name,
    liveConnection?.status,
    needsRestore,
    primarySub?.valid_until,
  ]);

  const metrics = useMemo(() => {
    const ageDays = session?.user?.first_connected_at
      ? Math.max(1, Math.ceil((Date.now() - new Date(session.user.first_connected_at).getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    const totalTrafficBytes = usageQuery.data?.points?.reduce(
      (acc, point) => acc + (point.bytes_in ?? 0) + (point.bytes_out ?? 0),
      0,
    ) ?? 0;

    const isUsageLoading = usageQuery.isLoading;

    return {
      activeStreak: ageDays > 0 ? `${ageDays}d` : "0d",
      trustScore: activeSub ? String(Math.min(99, 95 + Math.min(4, Math.floor(ageDays / 10)))) : "95",
      sessionTraffic: isUsageLoading ? "—" : formatBytes(totalTrafficBytes, { digits: 1 }),
    };
  }, [session?.user?.first_connected_at, usageQuery.data, usageQuery.isLoading, activeSub]);

  const renameDeviceMutation = useMutation({
    mutationFn: async ({ deviceId, deviceName }: { deviceId: string; deviceName: string }) => {
      await webappApi.patch(`/webapp/devices/${deviceId}`, {
        device_name: deviceName.trim() || null,
      });
    },
    onSuccess: () => {
      addToast("Device name updated", "success");
      notify("success");
      void queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
    },
    onError: () => addToast("Could not update the device name", "error"),
  });

  const issueMutation = useMutation({
    mutationFn: async (deviceName?: string) => {
      const response = await webappApi.post<WebAppIssueDeviceResponse>("/webapp/devices/issue", {});
      return { response, deviceName };
    },
    onSuccess: async ({ response, deviceName }) => {
      setIssuedConfig(response);
      setIsImportedAcknowledged(false);
      if (deviceName && response.device_id) {
        try {
          await webappApi.patch(`/webapp/devices/${response.device_id}`, { device_name: deviceName.trim() });
        } catch {
          addToast("Device added, but the name could not be saved", "info");
        }
      }
      if (isOnboarding && onboardingStep < 2) {
        await setOnboardingStep(2);
      }
      track("device_issue_success", { screen_name: "home" });
      addToast("Device added. Your config is ready to import.", "success");
      notify("success");
      void queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
    },
    onError: (err) => {
      addToast(getErrorMessage(err, "Could not add the device"), "error");
      notify("error");
    },
  });

  const replaceMutation = useMutation<WebAppIssueDeviceResponse, Error, string>({
    mutationFn: async (deviceId: string) =>
      webappApi.post<WebAppIssueDeviceResponse>(`/webapp/devices/${deviceId}/replace-with-new`),
    onSuccess: (response) => {
      setIssuedConfig(response);
      setIsImportedAcknowledged(false);
      addToast("A fresh config is ready to import.", "success");
      notify("success");
      void queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
    },
    onError: () => addToast("Could not prepare a fresh config", "error"),
  });

  const confirmMutation = useMutation<void, Error, string>({
    mutationFn: async (deviceId: string) => {
      await webappApi.post(`/webapp/devices/${deviceId}/confirm-connected`);
    },
    onSuccess: async (_data, deviceId) => {
      setIsImportedAcknowledged(true);
      track("connect_confirmed", { screen_name: "home", device_id: deviceId });
      addToast("Setup saved", "success");
      notify("success");
      void queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
      if (isOnboarding) {
        await completeOnboarding();
      }
    },
    onError: () => addToast("Could not save setup progress", "error"),
  });

  const revokeMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      await webappApi.post(`/webapp/devices/${deviceId}/revoke`);
    },
    onSuccess: () => {
      addToast("Device removed", "success");
      notify("success");
      setRevokeId(null);
      void queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
    },
    onError: () => addToast("Could not remove the device", "error"),
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      return webappApi.post<{ plan_id?: string; redirect_to?: string }>("/webapp/subscription/restore", {
        subscription_id: primarySub?.id,
        ...(primarySub?.plan_id ? { plan_id: primarySub.plan_id } : {}),
      });
    },
    onSuccess: (response) => {
      addToast("Access restored", "success");
      void queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
      const target = response.redirect_to ?? (response.plan_id ? `/plan/checkout/${response.plan_id}` : "/");
      navigate(target, { replace: true });
    },
    onError: () => addToast("Could not restore access", "error"),
  });

  useEffect(() => {
    if (usageQuery.data) {
      track("home_metrics_load", {
        active_streak: metrics.activeStreak,
        trust_score: metrics.trustScore,
        usage: metrics.sessionTraffic,
        points_count: usageQuery.data.points?.length ?? 0,
      });
    }
  }, [usageQuery.data, metrics, track]);

  useEffect(() => {
    if (hasConfirmedSetup && !isImportedAcknowledged) {
      setIsImportedAcknowledged(true);
      return;
    }
    if (!issuedConfig && state === "ready") {
      setIsImportedAcknowledged(true);
    }
  }, [hasConfirmedSetup, isImportedAcknowledged, issuedConfig, state]);

  const handleDownloadConfig = useCallback(() => {
    if (!configText) return;
    try {
      const shortId = configDeviceId?.slice(0, 8) || "device";
      const fileName = `amnezia-${shortId}.conf`;
      const nav = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
        share?: (data: { files?: File[]; title?: string }) => Promise<void>;
      };
      const file = new File([configText], fileName, { type: "application/octet-stream" });
      if (typeof nav.share === "function" && typeof nav.canShare === "function" && nav.canShare({ files: [file] })) {
        track("config_download", { screen_name: "home" });
        void nav.share({ files: [file], title: "AmneziaVPN config" });
        return;
      }
      const blob = new Blob([configText], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      track("config_download", { screen_name: "home" });
    } catch {
      addToast("Could not download the config", "error");
    }
  }, [addToast, configDeviceId, configText, track]);

  const handleCopyConfig = useCallback(async () => {
    if (!configText) return false;
    try {
      await navigator.clipboard.writeText(configText);
      return true;
    } catch {
      addToast("Could not copy the config", "error");
      return false;
    }
  }, [addToast, configText]);

  const handleCopyReferralLink = useCallback(async () => {
    if (!shareUrl) return false;
    try {
      await navigator.clipboard.writeText(shareUrl);
      addToast("Referral link copied", "success");
      return true;
    } catch {
      addToast("Could not copy the referral link", "error");
      return false;
    }
  }, [addToast, shareUrl]);

  const handleIssueDevice = useCallback(
    (deviceName?: string) => {
      impact("medium");
      track("device_issue_started", { screen_name: "home" });
      issueMutation.mutate(deviceName);
    },
    [impact, issueMutation, track],
  );

  const handleContinueSetup = useCallback(async () => {
    if (!isOnboarding) return;
    await setOnboardingStep(Math.max(onboardingStep, 1));
  }, [isOnboarding, onboardingStep, setOnboardingStep]);

  const handleAcknowledgeImport = useCallback(async (deviceId?: string) => {
    const targetDeviceId = deviceId ?? configDeviceId ?? activeDevices[0]?.id ?? null;
    if (!targetDeviceId) return;
    await confirmMutation.mutateAsync(targetDeviceId);
  }, [activeDevices, configDeviceId, confirmMutation]);

  return {
    pageState,
    state,
    routeReason,
    flowContext,
    homePageContent,
    plans,
    currentPlan,
    currentPlanName,
    currentPlanDuration,
    latestDeviceDelivery,
    liveConnection,
    amneziaVpnKey,
    primarySub,
    activeSub,
    activeDevices,
    issuedConfig,
    configText,
    profileName,
    profileInitial,
    profilePhotoUrl,
    shareUrl,
    botUsername,
    metrics,
    canAddDevice,
    deviceLimit,
    hasConfirmedSetup,
    connectionConfirmed,
    latestDeviceName: latestActiveDevice?.device_name ?? "Not added",
    isOnboarding,
    isOnline,
    needsRestore,
    defaultDeviceName: resolveDeviceDraft(),
    isIssuingDevice: issueMutation.isPending,
    isReplacingId: replaceMutation.isPending ? replaceMutation.variables ?? null : null,
    isConfirmingId: confirmMutation.isPending ? confirmMutation.variables ?? null : null,
    isRenaming: renameDeviceMutation.isPending,
    revokeId,
    setRevokeId,
    isRevoking: revokeMutation.isPending,
    isRestoring: restoreMutation.isPending,
    issueErrorMessage: issueMutation.isError ? getErrorMessage(issueMutation.error, "Could not add the device") : null,
    handleIssueDevice,
    handleReplaceDevice: (deviceId: string) => replaceMutation.mutate(deviceId),
    handleRenameDevice: (deviceId: string, deviceName: string) =>
      renameDeviceMutation.mutate({ deviceId, deviceName }),
    handleAcknowledgeImport,
    handleCopyConfig,
    handleDownloadConfig,
    handleCopyReferralLink,
    handleRemoveDevice: () => {
      if (!revokeId) return;
      revokeMutation.mutate(revokeId);
    },
    handleContinueSetup,
    handleRestoreAccess: () => restoreMutation.mutate(),
  };
}
