import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Skeleton,
  useToast,
  PageFrame,
  PageSection,
  MissionAlert,
  MissionCard,
  MissionChip,
  MissionModuleHead,
  MissionPrimaryButton,
  MissionProgressBar,
  MissionSecondaryButton,
  SessionMissing,
} from "@/design-system";
import type { WebAppServersResponse, WebAppServerItem } from "@vpn-suite/shared";
import { useWebappToken, webappApi } from "@/api/client";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function ServerSelectionPage() {
  const hasToken = !!useWebappToken();
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [pendingServerId, setPendingServerId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<WebAppServersResponse>({
    queryKey: ["webapp", "servers"],
    queryFn: () => webappApi.get<WebAppServersResponse>("/webapp/servers"),
    enabled: hasToken,
  });

  const selectMutation = useMutation({
    mutationFn: (payload: { server_id?: string; mode?: "auto" | "manual" }) =>
      webappApi.post("/webapp/servers/select", payload),
    onSuccess: () => {
      addToast("Server preference updated", "success");
      queryClient.invalidateQueries({ queryKey: ["webapp", "servers"] });
    },
    onError: () => {
      addToast("Could not update server preference", "error");
    },
    onSettled: () => setPendingServerId(null),
  });
  const pageTitle = "Servers";
  const pageSubtitle = "Choose route and location";

  if (!hasToken) {
    return (
      <SessionMissing message="Your Telegram session is not active. Close and reopen the mini app from the bot." />
    );
  }

  if (error) {
    return (
      <PageFrame title={pageTitle} subtitle={pageSubtitle}>
        <MissionCard tone="red" className="module-card">
          <MissionAlert
            tone="error"
            title="Could not load servers"
            message="We could not load server list. Please try again later."
          />
          <div className="btn-row">
            <MissionSecondaryButton onClick={() => queryClient.invalidateQueries({ queryKey: ["webapp", "servers"] })}>
              Try again
            </MissionSecondaryButton>
          </div>
        </MissionCard>
      </PageFrame>
    );
  }

  if (isLoading || !data) {
    return (
      <PageFrame title={pageTitle} subtitle={pageSubtitle}>
        <Skeleton className="skeleton-h-lg" />
        <Skeleton className="skeleton-h-hero" />
      </PageFrame>
    );
  }

  const handleAutoSelect = () => {
    setPendingServerId("auto");
    selectMutation.mutate({ mode: "auto" });
  };

  const handleSelectServer = (server: WebAppServerItem) => {
    setPendingServerId(server.id);
    selectMutation.mutate({ server_id: server.id, mode: "manual" });
  };

  return (
    <PageFrame title={pageTitle} subtitle={pageSubtitle}>
      <PageSection title="Routing mode" description="Use automatic routing or lock a preferred location.">
        <MissionCard tone="blue" className="module-card">
          <p className="op-desc type-body-sm">
            {data.auto_select
              ? "Automatic server selection is enabled."
              : "Manual server preference is enabled."}
          </p>
          <p className="op-desc type-body-sm">We prioritize healthy, low-load servers near your region.</p>
          <div className="btn-row">
            {data.auto_select ? (
              <MissionSecondaryButton
                onClick={handleAutoSelect}
                disabled={!isOnline || (selectMutation.isPending && pendingServerId === "auto")}
              >
                {selectMutation.isPending && pendingServerId === "auto" ? (
                  <>
                    <svg className="spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                      <circle cx="12" cy="12" r="8" strokeOpacity="0.35" />
                      <path d="M20 12a8 8 0 0 0-8-8" />
                    </svg>
                    <span>Applying…</span>
                  </>
                ) : (
                  "Use best server"
                )}
              </MissionSecondaryButton>
            ) : (
              <MissionPrimaryButton
                onClick={handleAutoSelect}
                disabled={!isOnline || (selectMutation.isPending && pendingServerId === "auto")}
              >
                {selectMutation.isPending && pendingServerId === "auto" ? (
                  <>
                    <svg className="spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                      <circle cx="12" cy="12" r="8" strokeOpacity="0.35" />
                      <path d="M20 12a8 8 0 0 0-8-8" />
                    </svg>
                    <span>Applying…</span>
                  </>
                ) : (
                  "Use best server"
                )}
              </MissionPrimaryButton>
            )}
          </div>
        </MissionCard>
      </PageSection>

      <PageSection
        title="Locations"
        action={<MissionChip tone="neutral" className="section-meta-chip miniapp-tnum">{data.items.length} nodes</MissionChip>}
      >
        <div className="stack">
          {data.items.map((server) => {
            const load = server.load_percent ?? 0;
            const isPending = selectMutation.isPending && pendingServerId === server.id;
            const code = (server.region ?? server.name ?? "??").slice(0, 2).toUpperCase();
            return (
              <MissionCard key={server.id} tone={server.is_current ? "green" : "blue"} className="module-card">
                <MissionModuleHead
                  label={`Node ${code}`}
                  chip={<MissionChip tone={server.is_current ? "green" : "neutral"}>{server.is_current ? "Current" : "Available"}</MissionChip>}
                />
                <div className="data-grid">
                  <div className="data-cell">
                    <div className="dc-key">Location</div>
                    <div className="dc-val teal">{server.name}</div>
                  </div>
                  <div className="data-cell">
                    <div className="dc-key">Latency</div>
                    <div className={`dc-val ${server.avg_ping_ms != null ? "green" : "mut"} miniapp-tnum`}>
                      {server.avg_ping_ms != null ? `${Math.round(server.avg_ping_ms)}ms` : "--"}
                    </div>
                  </div>
                </div>
                <div className="server-load">
                  <div className="module-head">
                    <span className="dc-key">Load</span>
                    <span className="dc-val miniapp-tnum">{Math.round(load)}%</span>
                  </div>
                  <MissionProgressBar
                    percent={load}
                    tone={load >= 85 ? "danger" : load >= 65 ? "warning" : "healthy"}
                    staticFill
                    ariaLabel={`${server.name} load ${Math.round(load)}%`}
                  />
                </div>
                {server.is_current ? (
                  <MissionSecondaryButton
                    onClick={() => handleSelectServer(server)}
                    disabled={!isOnline || isPending}
                  >
                    {isPending ? (
                      <>
                        <svg className="spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                          <circle cx="12" cy="12" r="8" strokeOpacity="0.35" />
                          <path d="M20 12a8 8 0 0 0-8-8" />
                        </svg>
                        <span>Selecting…</span>
                      </>
                    ) : (
                      "Current"
                    )}
                  </MissionSecondaryButton>
                ) : (
                  <MissionPrimaryButton
                    onClick={() => handleSelectServer(server)}
                    disabled={!isOnline || isPending}
                  >
                    {isPending ? (
                      <>
                        <svg className="spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                          <circle cx="12" cy="12" r="8" strokeOpacity="0.35" />
                          <path d="M20 12a8 8 0 0 0-8-8" />
                        </svg>
                        <span>Selecting…</span>
                      </>
                    ) : (
                      "Select"
                    )}
                  </MissionPrimaryButton>
                )}
              </MissionCard>
            );
          })}
        </div>
      </PageSection>
    </PageFrame>
  );
}
