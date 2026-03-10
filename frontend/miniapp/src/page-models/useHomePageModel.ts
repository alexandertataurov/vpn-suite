import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { WebAppServersResponse, WebAppUsageResponse } from "@vpn-suite/shared";
import { getPlans } from "@/api";
import { useWebappToken, webappApi } from "@/api/client";
import { useSession } from "@/hooks/useSession";
import { useTrackScreen } from "@/hooks/useTrackScreen";
import { useI18n } from "@/hooks/useI18n";
import { webappQueryKeys } from "@/lib/query-keys/webapp.query-keys";
import { formatBytes, formatDurationShort } from "@/lib/utils/format";
import type { StandardPageHeader, StandardPageState, StandardSectionBadge } from "./types";
import {
  daysUntil,
  getActiveDevices,
  getActiveSubscription,
  hasConfirmedConnection,
} from "./helpers";
import { evaluateUpsell, type UpsellDecision } from "./upsell";
import { DEFAULT_USAGE_SOFT_CAP_BYTES, clamp } from "./plan-helpers";

export interface HomePageModel {
  header: StandardPageHeader;
  pageState: StandardPageState;
  connectionHero: {
    state: "inactive" | "connecting" | "connected";
    serverKeyLabel: string;
    serverLabel: string;
    currentIpKeyLabel: string;
    currentIp: string;
    protocolLabel: string;
    showCurrentIpCell: boolean;
    title: string;
    hint: string;
    metrics: Array<{
      keyLabel: string;
      valueLabel: string;
      percent: number;
      tone: "healthy" | "warning" | "danger";
    }>;
  };
  hasSubscription: boolean;
  primaryAction: {
    label: string;
    to: string;
    secondaryLabel?: string;
    secondaryTo?: string;
  };
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
  const { t } = useI18n();

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

  const planDeviceLimit = currentPlan?.device_limit ?? null;
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
      deviceLimit: planDeviceLimit ?? activeSub?.device_limit ?? null,
      isDeviceLimitError: false,
    }),
    [activeSub, activeDevices.length, currentPlan, planDeviceLimit, plans, subscriptionStatusForUpsell],
  );
  const primaryUpsell = useMemo(() => evaluateUpsell(upsellContext, t), [upsellContext, t]);

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
  const locationLabel = !serversData || serversData.auto_select ? "Fastest available" : (currentServer?.name ?? "Fastest available");
  // VPN tunnel RTT (from device telemetry via /webapp/servers avg_ping_ms) — connection speed between VPN server and user machine
  const vpnLatency =
    currentServer?.avg_ping_ms != null && currentServer.avg_ping_ms > 0
      ? `${Math.round(currentServer.avg_ping_ms)}ms`
      : null;
  const connectedLatency = vpnLatency ?? "--";

  const deviceLimit = planDeviceLimit ?? activeSub?.device_limit ?? null;
  const usedDevices = activeDevices.length;
  const hasConfirmedDevice = hasConfirmedConnection(data);
  const latestHandshakeMs = activeDevices.reduce<number | null>((latest, device) => {
    if (!device.last_seen_handshake_at) return latest;
    const ts = new Date(device.last_seen_handshake_at).getTime();
    if (Number.isNaN(ts)) return latest;
    return latest == null || ts > latest ? ts : latest;
  }, null);

  const phase = !activeSub
    ? "inactive"
    : !hasConfirmedDevice
      ? "connecting"
      : "connected";
  const statusText = phase === "connected"
    ? t("home.status_connected_title")
    : phase === "connecting"
      ? activeDevices.length === 0
        ? t("home.status_connecting_zero_devices_title")
        : t("home.status_connecting_title")
      : t("home.status_inactive_title");
  const statusHint = phase === "inactive"
    ? t("home.status_inactive_hint")
    : phase === "connecting"
      ? activeDevices.length === 0
        ? t("home.status_connecting_hint_no_devices")
        : t("home.status_connecting_hint")
      : t("home.status_connected_hint");

  const totalTrafficBytes = usageData?.points?.reduce(
    (acc, point) => acc + (point.bytes_in ?? 0) + (point.bytes_out ?? 0),
    0,
  );
  const latencyMs = currentServer?.avg_ping_ms ?? null;
  const latencyLabel = phase === "connected" ? connectedLatency : (phase === "connecting" ? "Testing servers…" : "--");
  const bandwidthLabel = activeSub && totalTrafficBytes != null ? formatBytes(totalTrafficBytes, { digits: 1 }) : "--";
  const currentIpLabel = data?.public_ip ?? "--";
  const currentIpKeyLabel = t("home.connection_current_ip_key");
  const lastActiveLabel = latestHandshakeMs != null && latestHandshakeMs <= Date.now()
    ? formatDurationShort(Date.now() - latestHandshakeMs)
    : "--";
  const latencyPercent = latencyMs != null ? clamp(100 - latencyMs / 2.4, 8, 100) : 0;
  const latencyTone: "healthy" | "warning" | "danger" =
    latencyMs == null ? "danger" : latencyMs <= 90 ? "healthy" : latencyMs <= 180 ? "warning" : "danger";
  const activityAgeMs = latestHandshakeMs != null ? Math.max(0, Date.now() - latestHandshakeMs) : null;
  const activityPercent = activityAgeMs != null ? clamp(100 - (activityAgeMs / 86_400_000) * 100, 0, 100) : 0;
  const activityTone: "healthy" | "warning" | "danger" =
    activityAgeMs == null ? "danger" : activityAgeMs <= 3_600_000 ? "healthy" : activityAgeMs <= 21_600_000 ? "warning" : "danger";
  const trafficPercent =
    activeSub && totalTrafficBytes != null
      ? clamp((totalTrafficBytes / DEFAULT_USAGE_SOFT_CAP_BYTES) * 100, 0, 100)
      : 0;
  const trafficTone: "healthy" | "warning" | "danger" =
    trafficPercent >= 100 ? "danger" : trafficPercent >= 80 ? "warning" : "healthy";

  const header: StandardPageHeader = {
    title: t("home.header_title"),
    subtitle: !activeSub
      ? t("home.header_no_plan_subtitle")
      : phase === "connected"
        ? t("home.header_connected_subtitle")
        : t("home.header_default_subtitle"),
  };

  const pageState: StandardPageState = !hasToken
    ? { status: "empty", title: t("common.session_missing_title") }
    : isLoading || (error != null && isFetching)
      ? { status: "loading" }
      : error
        ? {
            status: "error",
            title: t("common.could_not_load_account_status"),
            message: t("common.could_not_load_account_status"),
            onRetry: () => refetch(),
          }
        : { status: "ready" };

  return {
    header,
    pageState,
    connectionHero: {
      state: phase,
      serverKeyLabel: t("home.connection_server_key"),
      serverLabel: locationLabel,
      currentIpKeyLabel,
      currentIp: currentIpLabel,
      protocolLabel: phase === "inactive" ? "--" : "AmneziaWG",
      showCurrentIpCell: !!data?.public_ip,
      title: statusText,
      hint: statusHint,
      metrics: [
        {
          keyLabel: t("home.connection_latency_key"),
          valueLabel: latencyLabel,
          percent: latencyPercent,
          tone: latencyTone,
        },
        {
          keyLabel: t("home.connection_last_active_key"),
          valueLabel: lastActiveLabel,
          percent: activityPercent,
          tone: activityTone,
        },
        {
          keyLabel: t("home.connection_traffic_key"),
          valueLabel: bandwidthLabel,
          percent: trafficPercent,
          tone: trafficTone,
        },
      ],
    },
    hasSubscription: Boolean(activeSub),
    primaryAction: !activeSub
      ? {
          label: t("home.primary_choose_plan"),
          to: "/plan",
          secondaryLabel: t("home.primary_contact_support"),
          secondaryTo: "/support",
        }
      : activeDevices.length === 0
        ? {
            label: t("home.primary_add_device"),
            to: "/devices/issue",
            secondaryLabel: t("home.primary_contact_support"),
            secondaryTo: "/support",
          }
        : hasConfirmedDevice
          ? {
              label: t("home.primary_manage_devices"),
              to: "/devices",
              secondaryLabel: t("home.primary_open_setup_status"),
              secondaryTo: "/connect-status",
            }
          : {
              label: t("home.primary_view_setup"),
              to: "/connect-status",
              secondaryLabel: t("home.primary_manage_devices"),
              secondaryTo: "/devices",
            },
    primaryUpsell,
    planId: activeSub?.plan_id ?? null,
    quickAccessMeta: {
      badge: !activeSub
        ? { tone: "blue", label: t("home.quick_access_badge_start_here") }
        : {
            tone: "neutral",
            label:
              deviceLimit != null
                ? t("home.quick_access_badge_devices", {
                    used: usedDevices,
                    limit: deviceLimit,
                  })
                : t("home.quick_access_badge_devices_unbounded", {
                    used: usedDevices,
                  }),
            emphasizeNumeric: true,
          },
      description: !activeSub
        ? t("home.quick_access_description_no_plan")
        : t("home.quick_access_description"),
    },
    refetch: () => void refetch(),
  };
}
