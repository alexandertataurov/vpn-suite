import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Panel,
  Button,
  Skeleton,
  InlineAlert,
  useToast,
  ProgressBar,
  PageFrame,
  PageSection,
  ActionRow,
} from "../ui";
import type { WebAppServersResponse, WebAppServerItem } from "@/lib/types";
import { useWebappToken, webappApi } from "../api/client";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { SessionMissing } from "@/components";

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
  const pageTitle = "Server Matrix";
  const pageSubtitle = "Regional routing and load";
  const backHomeLink = (
    <Link to="/" className="link-interactive page-anchor-link">
      Back
    </Link>
  );

  if (!hasToken) {
    return (
      <SessionMissing message="Your Telegram session is not active. Close and reopen the mini app from the bot." />
    );
  }

  if (error) {
    return (
      <PageFrame title={pageTitle} subtitle={pageSubtitle}>
        <InlineAlert
          variant="error"
          title="Could not load servers"
          message="We could not load server list. Please try again later."
        />
        <ActionRow fullWidth>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["webapp", "servers"] })}
          >
            Try again
          </Button>
          {backHomeLink}
        </ActionRow>
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
    <PageFrame title="Server Matrix" subtitle="90+ locations worldwide">

      <PageSection title="ROUTING MODE" description="Choose automatic routing or lock a preferred location.">
        <Panel variant="surface" className="card edge et module-card">
          <p className="type-body-sm">
            {data.auto_select
              ? "Automatic server selection is enabled."
              : "Manual server preference is enabled."}
          </p>
          <p className="type-meta">We prioritize healthy, low-load servers close to your region.</p>
          <ActionRow fullWidth>
            <Button
              size="sm"
              variant={data.auto_select ? "secondary" : "primary"}
              onClick={handleAutoSelect}
              loading={selectMutation.isPending && pendingServerId === "auto"}
              disabled={!isOnline || (selectMutation.isPending && pendingServerId === "auto")}
            >
              USE BEST SERVER
            </Button>
          </ActionRow>
        </Panel>
      </PageSection>

      <PageSection
        title="LOCATION POOL"
        action={<span className="chip cn section-meta-chip miniapp-tnum">{data.items.length} NODES</span>}
      >
        <div className="stack">
          {data.items.map((server) => {
            const load = server.load_percent ?? 0;
            const isPending = selectMutation.isPending && pendingServerId === server.id;
            const code = (server.region ?? server.name ?? "??").slice(0, 2).toUpperCase();
            return (
              <Panel
                key={server.id}
                variant="surface"
                className={`card edge card-row ${server.is_current ? "eg" : "et"}`}
              >
                <span className="badge badge-sm">{code}</span>
                <div className="min-w-0">
                  <h3 className="type-h4 tracking-trim data-truncate">
                    {server.name}
                  </h3>
                  <p className="type-meta miniapp-tnum">
                    {server.avg_ping_ms != null ? `${Math.round(server.avg_ping_ms)} ms` : "—"}
                  </p>
                </div>
                <div className="server-metrics">
                  <p className="type-meta miniapp-tnum">
                    {Math.round(load)}% LOAD
                  </p>
                  <ProgressBar
                    value={load}
                    max={100}
                    aria-label={`${server.name} load ${Math.round(load)}%`}
                  />
                </div>
                <Button
                  size="sm"
                  variant={server.is_current ? "secondary" : "primary"}
                  onClick={() => handleSelectServer(server)}
                  loading={isPending}
                  disabled={!isOnline || isPending}
                >
                  {server.is_current ? "SELECTED" : "SELECT"}
                </Button>
              </Panel>
            );
          })}
        </div>
      </PageSection>
    </PageFrame>
  );
}
