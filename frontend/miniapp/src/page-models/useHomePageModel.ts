import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { WebAppServersResponse, WebAppUsageResponse } from "@vpn-suite/shared";
import { getPlans } from "@/api";
import { useWebappToken, webappApi } from "@/api/client";
import { useConnectionStatus } from "@/hooks/features/useConnectionStatus";
import { useSession } from "@/hooks/useSession";
import { useTrackScreen } from "@/hooks/useTrackScreen";
import { getBaseUrl } from "@/lib/api-client";
import { webappQueryKeys } from "@/lib/query-keys/webapp.query-keys";
import { formatBytes, formatDurationShort } from "@/lib/utils/format";
import type { StandardPageHeader, StandardPageState, StandardSectionBadge } from "./types";
import { daysUntil, getActiveDevices, getActiveSubscription } from "./helpers";
import { evaluateUpsell, type UpsellDecision } from "./upsell";

export interface HomePageModel {
  header: StandardPageHeader;
  pageState: StandardPageState;
  connectionHero: {
    state: "inactive" | "connecting" | "connected";
    serverKeyLabel: string;
    serverLabel: string;
    latencyKeyLabel: string;
    latencyLabel: string;
    currentIpKeyLabel: string;
    currentIp: string;
    durationKeyLabel: string;
    durationLabel: string;
    trafficKeyLabel: string;
    trafficLabel: string;
    protocolLabel: string;
    showCurrentIpCell: boolean;
    title: string;
    hint: string;
  };
  hasSubscription: boolean;
  quickAccessMeta: { badge: StandardSectionBadge; description: string };
  /** Primary monetization card (spec §14.1). */
  primaryUpsell: UpsellDecision | null;
  planId: string | null;
  refetch: () => void;
}

export function useHomePageModel(): HomePageModel {
  const hasToken = !!useWebappToken();
  const { data, isLoading, error, refetch, isFetching } = useSession(hasToken);
  const activeSub = getActiveSubscription(data);
  const activeDevices = getActiveDevices(data);

  const { data: plansData } = useQuery({
    queryKey: [...webappQueryKeys.plans()],
    queryFn: getPlans,
    enabled: hasToken && !!activeSub,
  });
  const plans = useMemo(() => plansData?.items ?? [], [plansData?.items]);
  const currentPlan = useMemo(
    () => (activeSub?.plan_id ? plans.find((p) => p.id === activeSub.plan_id) : undefined),
    [plans, activeSub?.plan_id],
  );

  const subscriptionStatusForUpsell = !activeSub
    ? "none" as const
    : activeSub.is_trial
      ? "trial" as const
      : daysUntil(activeSub.valid_until) <= 0
        ? "expired" as const
        : "active" as const;

  const upsellContext = useMemo(
    () => ({
      page: "home" as const,
      currentPlanId: activeSub?.plan_id ?? null,
      currentPlan: currentPlan ?? null,
      plans,
      subscriptionStatus: subscriptionStatusForUpsell,
      daysToExpiry: activeSub ? daysUntil(activeSub.valid_until) : null,
      trialDaysLeft: activeSub?.is_trial ? daysUntil(activeSub.trial_ends_at) : null,
      devicesUsed: activeDevices.length,
      deviceLimit: activeSub?.device_limit ?? null,
      isDeviceLimitError: false,
    }),
    [activeSub, activeDevices.length, currentPlan, plans, subscriptionStatusForUpsell],
  );
  const primaryUpsell = useMemo(() => evaluateUpsell(upsellContext), [upsellContext]);

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

  const apiBase = getBaseUrl();
  const healthUrl = apiBase.replace(/\/api\/v1\/?$/, "") ? `${apiBase.replace(/\/api\/v1\/?$/, "")}/health` : "/health";
  const { latency: apiLatencyMs } = useConnectionStatus({ latencyProbeUrl: healthUrl, pollMs: 15_000 });

  const currentServer = serversData?.items.find((server) => server.is_current);
  const locationLabel = !serversData || serversData.auto_select ? "Fastest available" : (currentServer?.name ?? "Fastest available");
  const vpnLatency =
    currentServer?.avg_ping_ms != null && currentServer.avg_ping_ms > 0
      ? `${Math.round(currentServer.avg_ping_ms)}ms`
      : null;
  const connectedLatency =
    vpnLatency ??
    (apiLatencyMs != null && apiLatencyMs >= 0 ? `${apiLatencyMs}ms` : "--");

  const deviceLimit = activeSub?.device_limit ?? null;
  const usedDevices = activeDevices.length;
  const latestHandshakeMs = activeDevices.reduce<number | null>((latest, device) => {
    if (!device.last_seen_handshake_at) return latest;
    const ts = new Date(device.last_seen_handshake_at).getTime();
    if (Number.isNaN(ts)) return latest;
    return latest == null || ts > latest ? ts : latest;
  }, null);

  const phase = !activeSub
    ? "inactive"
    : activeDevices.length === 0 || isFetching
      ? "connecting"
      : "connected";
  const statusText = phase === "connected"
    ? "Configuration active"
    : phase === "connecting"
      ? "Config pending"
      : "Config inactive";
  const statusHint = phase === "inactive"
    ? "Set up config on a device"
    : phase === "connecting"
      ? "Add device to get config"
      : locationLabel;

  const totalTrafficBytes = usageData?.points?.reduce(
    (acc, point) => acc + (point.bytes_in ?? 0) + (point.bytes_out ?? 0),
    0,
  );
  const latencyLabel = phase === "connected" ? connectedLatency : (phase === "connecting" ? "Testing servers…" : "--");
  const bandwidthLabel = activeSub && totalTrafficBytes != null ? formatBytes(totalTrafficBytes, { digits: 1 }) : "--";
  const currentIpLabel = data?.public_ip ?? "--";
  const currentIpKeyLabel = "Current IP";
  const lastActiveLabel = latestHandshakeMs != null && latestHandshakeMs <= Date.now()
    ? formatDurationShort(Date.now() - latestHandshakeMs)
    : "--";

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
      serverKeyLabel: "Server preset",
      serverLabel: locationLabel,
      latencyKeyLabel: "Server latency",
      latencyLabel,
      currentIpKeyLabel,
      currentIp: currentIpLabel,
      durationKeyLabel: "Device last active",
      durationLabel: lastActiveLabel,
      trafficKeyLabel: "Account traffic (7 days)",
      trafficLabel: bandwidthLabel,
      protocolLabel: phase === "inactive" ? "--" : "AmneziaWG",
      showCurrentIpCell: !!data?.public_ip,
      title: statusText,
      hint: statusHint,
    },
    hasSubscription: Boolean(activeSub),
    primaryUpsell,
    planId: activeSub?.plan_id ?? null,
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
    refetch: () => void refetch(),
  };
}
