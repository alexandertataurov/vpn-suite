import { useQuery } from "@tanstack/react-query";
import type { WebAppServersResponse } from "@/lib/types";
import { Skeleton, PageFrame, PageSection } from "../ui";
import {
  HomeHeroPanel,
  HomePrimaryActionZone,
  HomeQuickActionGrid,
  HomeDynamicBlock,
  FallbackScreen,
  SessionMissing,
} from "@/components";
import { useSession } from "../hooks/useSession";
import { useWebappToken, webappApi } from "../api/client";
import { useApiHealth } from "../hooks/useApiHealth";
import { useTrackScreen } from "../hooks/useTrackScreen";
import { useTelemetry } from "../hooks/useTelemetry";
import { useTelegramHaptics } from "../hooks/useTelegramHaptics";

export function HomePage() {
  const hasToken = !!useWebappToken();
  const { data, isLoading, error, refetch, isFetching } = useSession(hasToken);
  const { error: healthError } = useApiHealth();
  const activeSub = data?.subscriptions?.find((s) => s.status === "active");
  const activeDevices = data?.devices?.filter((d) => !d.revoked_at) ?? [];

  const { data: serversData } = useQuery<WebAppServersResponse>({
    queryKey: ["webapp", "servers"],
    queryFn: () => webappApi.get<WebAppServersResponse>("/webapp/servers"),
    enabled: hasToken && !!activeSub,
  });

  const { track } = useTelemetry(activeSub?.plan_id ?? null);
  const { impact } = useTelegramHaptics();

  useTrackScreen("home", activeSub?.plan_id ?? null);

  const connected = !!(activeSub && activeDevices.length > 0);
  const currentServer = serversData?.items.find((server) => server.is_current);
  const locationLabel =
    !serversData || serversData.auto_select
      ? "Automatic"
      : (currentServer?.name ?? "Automatic");

  const deviceLimit = activeSub?.device_limit ?? null;
  const usedDevices = activeDevices.length;

  let daysLeft = 0;
  let subStatus: "active" | "expired" | "none" = "none";
  if (activeSub) {
    const expiresMs = new Date(activeSub.valid_until).getTime();
    const remainingDays = Math.ceil((expiresMs - Date.now()) / (1000 * 60 * 60 * 24));
    daysLeft = Math.max(0, remainingDays);
    subStatus = remainingDays <= 0 ? "expired" : "active";
  }

  const primaryLabel = activeSub
    ? activeDevices.length === 0
      ? "Get config"
      : "Manage Connection"
    : "Connect Now";
  const primaryTo = activeSub ? "/devices" : "/plan";

  const handlePrimaryCta = () => {
    impact("medium");
    track("cta_click", {
      cta_name: primaryLabel.replace(/\s+/g, "_").toLowerCase(),
      screen_name: "home",
    });
  };

  if (isLoading || (error && isFetching)) {
    return (
      <PageFrame title="Mission Control" subtitle="Live account and network telemetry">
        <PageSection title="NETWORK STATUS">
          <Skeleton variant="card" />
        </PageSection>
        <section>
          <Skeleton className="miniapp-skeleton-cta" />
        </section>
        <PageSection title="OPERATIONS">
          <div className="grid-2">
            <Skeleton variant="card" />
            <Skeleton variant="card" />
            <Skeleton variant="card" />
            <Skeleton variant="card" />
          </div>
        </PageSection>
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
      <PageSection
        title="NETWORK STATUS"
        action={<span className={`chip section-meta-chip ${connected ? "cg" : "cn"}`}>{connected ? "LIVE" : "IDLE"}</span>}
      >
        <HomeHeroPanel
          connected={connected}
          locationLabel={locationLabel}
          planId={activeSub?.plan_id ?? "—"}
          daysLeft={daysLeft}
          subStatus={subStatus}
          deviceCount={usedDevices}
          deviceLimit={deviceLimit}
        />
      </PageSection>
      <HomePrimaryActionZone
        primaryLabel={primaryLabel}
        primaryTo={primaryTo}
        onPrimaryClick={handlePrimaryCta}
      />
      <PageSection title="OPERATIONS" action={<span className="chip cn section-meta-chip">4 TASKS</span>}>
        <HomeQuickActionGrid hasSub={!!activeSub} hasDevices={activeDevices.length > 0} />
      </PageSection>
      <PageSection
        title="SIGNALS"
        action={<span className={`chip section-meta-chip ${healthError ? "ca" : "cg"}`}>{healthError ? "ATTN" : "CLEAR"}</span>}
      >
        <HomeDynamicBlock
          daysLeft={daysLeft}
          hasSub={!!activeSub}
          deviceLimit={deviceLimit}
          usedDevices={usedDevices}
          healthError={!!healthError}
        />
      </PageSection>
    </PageFrame>
  );
}
