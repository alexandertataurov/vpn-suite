import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { WebAppServersResponse, WebAppUsageResponse } from "@vpn-suite/shared";
import { useWebappToken, webappApi } from "@/api/client";
import { useAccountSignals } from "@/hooks/useAccountSignals";
import { useApiHealth } from "@/hooks/useApiHealth";
import { useSession } from "@/hooks/useSession";
import { useTrackScreen } from "@/hooks/useTrackScreen";
import { webappQueryKeys } from "@/lib/query-keys/webapp.query-keys";
import { formatBytes, formatDurationShort } from "@/lib/utils/format";
import type { StandardPageHeader, StandardPageState, StandardSectionBadge } from "./types";
import type { PlanItem, PlansResponse } from "./usePlanPageModel";
import {
  daysUntil,
  getActiveDevices,
  getActiveSubscription,
  getRenewalCheckoutPath,
  getUpgradeCheckoutPath,
  getUpgradeCheckoutPathForDeviceLimit,
  shouldShowUpsell,
} from "./helpers";

export interface HomePageModel {
  header: StandardPageHeader;
  pageState: StandardPageState;
  connectionHero: {
    state: "inactive" | "connecting" | "connected";
    serverLabel: string;
    latencyLabel: string;
    currentIpKeyLabel: string;
    currentIp: string;
    durationKeyLabel: string;
    durationLabel: string;
    trafficKeyLabel: string;
    trafficLabel: string;
    protocolLabel: string;
    title: string;
    hint: string;
  };
  hasSubscription: boolean;
  shouldPrioritizeSignals: boolean;
  quickAccessMeta: { badge: StandardSectionBadge; description: string };
  signalsMeta: { badge: StandardSectionBadge; description: string };
  signals: {
    daysLeft: number;
    hasSub: boolean;
    deviceLimit: number | null;
    usedDevices: number;
    healthError: boolean;
    showUpsellExpiry: boolean;
    showUpsellDeviceLimit: boolean;
  renewalTargetTo: string;
  upgradeTargetTo: string;
  upgradeTargetToDeviceLimit: string;
  isTrial: boolean;
    trialDaysLeft: number;
    showUpsellTrialEnd: boolean;
  };
  refetch: () => void;
}

export function useHomePageModel(): HomePageModel {
  const hasToken = !!useWebappToken();
  const { data, isLoading, error, refetch, isFetching } = useSession(hasToken);
  const { error: healthError } = useApiHealth(hasToken);
  const activeSub = getActiveSubscription(data);
  const activeDevices = getActiveDevices(data);

  const { data: plansData } = useQuery({
    queryKey: [...webappQueryKeys.plans()],
    queryFn: () => webappApi.get<PlansResponse>("/webapp/plans"),
    enabled: hasToken,
  });
  const plans = useMemo(() => plansData?.items ?? [], [plansData?.items]);
  const currentPlan = useMemo<PlanItem | undefined>(
    () => (activeSub?.plan_id ? plans.find((p) => p.id === activeSub.plan_id) : undefined),
    [plans, activeSub?.plan_id],
  );
  const showUpsellExpiry = shouldShowUpsell(currentPlan?.upsell_methods, "expiry");
  const showUpsellDeviceLimit = shouldShowUpsell(currentPlan?.upsell_methods, "device_limit");
  const trialDaysLeft = daysUntil(activeSub?.trial_ends_at);
  const isTrial = Boolean(activeSub?.is_trial);
  const showUpsellTrialEnd =
    isTrial && trialDaysLeft <= 7 && shouldShowUpsell(currentPlan?.upsell_methods, "trial_end");
  const renewalTargetTo = getRenewalCheckoutPath(activeSub?.plan_id);
  const upgradeTargetTo = getUpgradeCheckoutPath(plans, activeSub?.plan_id);
  const upgradeTargetToDeviceLimit = getUpgradeCheckoutPathForDeviceLimit(plans, activeSub?.plan_id);

  const { data: serversData } = useQuery<WebAppServersResponse>({
    queryKey: [...webappQueryKeys.servers()],
    queryFn: () => webappApi.get<WebAppServersResponse>("/webapp/servers"),
    enabled: hasToken && !!activeSub,
  });

  const { data: usageData } = useQuery<WebAppUsageResponse>({
    queryKey: [...webappQueryKeys.usage("7d")],
    queryFn: () => webappApi.get<WebAppUsageResponse>("/webapp/usage?range=7d"),
    enabled: hasToken && !!activeSub,
    staleTime: 60_000,
  });

  useTrackScreen("home", activeSub?.plan_id ?? null);

  const currentServer = serversData?.items.find((server) => server.is_current);
  const locationLabel = !serversData || serversData.auto_select ? "Automatic" : (currentServer?.name ?? "Automatic");
  const connectedLatency = currentServer?.avg_ping_ms != null && currentServer.avg_ping_ms > 0
    ? `${Math.round(currentServer.avg_ping_ms)}ms`
    : "--";

  const deviceLimit = activeSub?.device_limit ?? null;
  const usedDevices = activeDevices.length;
  const latestHandshakeMs = activeDevices.reduce<number | null>((latest, device) => {
    if (!device.last_seen_handshake_at) return latest;
    const ts = new Date(device.last_seen_handshake_at).getTime();
    if (Number.isNaN(ts)) return latest;
    return latest == null || ts > latest ? ts : latest;
  }, null);

  const daysLeft = daysUntil(activeSub?.valid_until);
  const phase = !activeSub
    ? "inactive"
    : activeDevices.length === 0 || isFetching
      ? "connecting"
      : "connected";
  const statusText = phase === "connected"
    ? "Connected · Secured"
    : phase === "connecting"
      ? "Connecting…"
      : "Connection inactive";
  const statusHint = phase === "inactive" ? "No active secure tunnel" : locationLabel;

  const totalTrafficBytes = usageData?.points?.reduce(
    (acc, point) => acc + (point.bytes_in ?? 0) + (point.bytes_out ?? 0),
    0,
  );
  const latencyLabel = phase === "connected" ? connectedLatency : "--";
  const bandwidthLabel = activeSub && totalTrafficBytes != null ? formatBytes(totalTrafficBytes, { digits: 1 }) : "--";
  const routeModeLabel = activeSub && phase !== "inactive"
    ? serversData?.auto_select === false ? "Manual" : "Auto"
    : "--";
  const currentIpLabel = data?.public_ip ?? routeModeLabel;
  const currentIpKeyLabel = data?.public_ip ? "Current IP" : "Route mode";
  const lastActiveLabel = latestHandshakeMs != null && latestHandshakeMs <= Date.now()
    ? formatDurationShort(Date.now() - latestHandshakeMs)
    : "--";

  const accountSignals = useAccountSignals();
  const signalCount = accountSignals.length;
  const shouldPrioritizeSignals = signalCount > 0;
  const signalsBadgeTone = signalCount === 0
    ? "green"
    : accountSignals.some((s) => s.tone === "warning")
      ? "amber"
      : "neutral";

  const header: StandardPageHeader = {
    title: "Mission Control",
    subtitle: !activeSub
      ? "Activate a plan to bring your tunnel online."
      : phase === "connected"
        ? "Monitor connection health and jump into account actions."
        : "Finish setup and review account signals before your next session.",
  };

  const pageState: StandardPageState = !hasToken
    ? { status: "empty", title: "Session missing" }
    : isLoading || (error != null && isFetching)
      ? { status: "loading" }
      : error
        ? {
            status: "error",
            title: "Could not load account status",
            message: "Could not load account status",
            onRetry: () => refetch(),
          }
        : { status: "ready" };

  return {
    header,
    pageState,
    connectionHero: {
      state: phase,
      serverLabel: locationLabel,
      latencyLabel,
      currentIpKeyLabel,
      currentIp: currentIpLabel,
      durationKeyLabel: "Last active",
      durationLabel: lastActiveLabel,
      trafficKeyLabel: "7d traffic",
      trafficLabel: bandwidthLabel,
      protocolLabel: phase === "inactive" ? "--" : "AWG",
      title: statusText,
      hint: statusHint,
    },
    hasSubscription: Boolean(activeSub),
    shouldPrioritizeSignals,
    quickAccessMeta: {
      badge: !activeSub
        ? { tone: "blue", label: "Start here" }
        : {
            tone: "neutral",
            label: deviceLimit != null ? `${usedDevices}/${deviceLimit} devices` : `${usedDevices} devices`,
            emphasizeNumeric: true,
          },
      description: !activeSub
        ? "Choose a plan first, then return here to manage access."
        : "Fast access to connection, plan, support, and account actions.",
    },
    signalsMeta: {
      badge: signalCount === 0
        ? { tone: "green", label: "All clear" }
        : {
            tone: signalsBadgeTone,
            label: `${signalCount} active`,
            emphasizeNumeric: true,
          },
      description: signalCount === 0
        ? "No renewal, capacity, or service issues need action."
        : "Renewal risk, capacity, and service health appear here first.",
    },
    signals: {
      daysLeft,
      hasSub: Boolean(activeSub),
      deviceLimit,
      usedDevices,
      healthError: Boolean(healthError),
      showUpsellExpiry,
      showUpsellDeviceLimit,
      renewalTargetTo,
      upgradeTargetTo,
      upgradeTargetToDeviceLimit,
      isTrial,
      trialDaysLeft,
      showUpsellTrialEnd,
    },
    refetch: () => void refetch(),
  };
}
