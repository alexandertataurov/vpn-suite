import { useQuery } from "@tanstack/react-query";
import type { WebAppServersResponse, WebAppUsageResponse } from "@/lib/types";
import {
  FallbackScreen,
  Skeleton,
  PageFrame,
  SectionDivider,
  HomeDynamicBlock,
  ConnectionStatusHero,
  HomeQuickActionGrid,
  SessionMissing,
} from "@/design-system";
import { formatBytes } from "@/lib/utils/format";
import { useSession } from "@/hooks/useSession";
import { useWebappToken, webappApi } from "@/api/client";
import { useApiHealth } from "@/hooks/useApiHealth";
import { useTrackScreen } from "@/hooks/useTrackScreen";

export function HomePage() {
  const hasToken = !!useWebappToken();
  const { data, isLoading, error, refetch, isFetching } = useSession(hasToken);
  const { error: healthError } = useApiHealth(hasToken);
  const activeSub = data?.subscriptions?.find((s) => s.status === "active");
  const activeDevices = data?.devices?.filter((d) => !d.revoked_at) ?? [];

  const { data: serversData } = useQuery<WebAppServersResponse>({
    queryKey: ["webapp", "servers"],
    queryFn: () => webappApi.get<WebAppServersResponse>("/webapp/servers"),
    enabled: hasToken && !!activeSub,
  });

  const { data: usageData } = useQuery<WebAppUsageResponse>({
    queryKey: ["webapp", "usage", "7d"],
    queryFn: () => webappApi.get<WebAppUsageResponse>("/webapp/usage?range=7d"),
    enabled: hasToken && !!activeSub,
    staleTime: 60_000,
  });

  useTrackScreen("home", activeSub?.plan_id ?? null);

  const currentServer = serversData?.items.find((server) => server.is_current);
  const locationLabel =
    !serversData || serversData.auto_select
      ? "Automatic"
      : (currentServer?.name ?? "Automatic");
  const connectedLatency = currentServer?.avg_ping_ms && currentServer.avg_ping_ms > 0
    ? `${Math.round(currentServer.avg_ping_ms)}ms`
    : "24ms";

  const deviceLimit = activeSub?.device_limit ?? null;
  const usedDevices = activeDevices.length;

  let daysLeft = 0;
  if (activeSub) {
    const expiresMs = new Date(activeSub.valid_until).getTime();
    const remainingDays = Math.ceil((expiresMs - Date.now()) / (1000 * 60 * 60 * 24));
    daysLeft = Math.max(0, remainingDays);
  }

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
  const statusHint = phase === "connected"
    ? `Server: ${locationLabel}`
    : phase === "connecting"
      ? `Syncing tunnel via ${locationLabel}`
      : "No active secure tunnel";

  const totalTrafficBytes = usageData?.points?.reduce(
    (acc, point) => acc + (point.bytes_in ?? 0) + (point.bytes_out ?? 0),
    0,
  );
  const latencyLabel = phase === "connected" ? connectedLatency : "--";
  const bandwidthLabel = activeSub && totalTrafficBytes != null
    ? formatBytes(totalTrafficBytes, { digits: 1 })
    : "--";
  const connectionState = phase as "inactive" | "connecting" | "connected";

  if (isLoading || (error && isFetching)) {
    return (
      <PageFrame title="Mission Control" subtitle="Live account and network telemetry">
        <SectionDivider label="NETWORK STATUS" className="stagger-1" />
        <Skeleton variant="card" className="stagger-2" />
        <SectionDivider label="OPERATIONS" className="stagger-3" />
        <div className="quick-action-grid quick-action-grid--skeleton stagger-4">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      </PageFrame>
    );
  }

  if (!hasToken) {
    return <SessionMissing />;
  }

  if (error) {
    return (
      <FallbackScreen
        title="Could not load account status"
        message="We could not load your VPN status. Tap Try again to reload, or reopen the app from the Telegram bot if it keeps failing."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <PageFrame title="Mission Control" subtitle="Live account and network telemetry">
      <ConnectionStatusHero
        state={connectionState}
        serverLabel={locationLabel}
        latencyLabel={latencyLabel}
        currentIp="--"
        durationLabel="--"
        trafficLabel={bandwidthLabel}
        protocolLabel={phase === "inactive" ? "--" : "AWG"}
        title={statusText}
        hint={statusHint}
      />
      <SectionDivider label="Quick Access" className="stagger-2" />
      <div className="stagger-3">
        <HomeQuickActionGrid hasSub={!!activeSub} />
      </div>
      <SectionDivider
        label="SIGNALS"
        count={healthError ? "ATTN" : "CLEAR"}
        className="stagger-4"
      />
      <div className="stagger-5">
        <HomeDynamicBlock
          daysLeft={daysLeft}
          hasSub={!!activeSub}
          deviceLimit={deviceLimit}
          usedDevices={usedDevices}
          healthError={!!healthError}
        />
      </div>
    </PageFrame>
  );
}
