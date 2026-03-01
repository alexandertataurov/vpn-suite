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
  PageScaffold,
  PageHeader,
  PageSection,
  ActionRow,
  Body,
  Caption,
  H3,
} from "../ui";
import type { WebAppServersResponse, WebAppServerItem } from "@vpn-suite/shared/types";
import { useWebappToken, webappApi } from "../api/client";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { SessionMissing } from "../components/SessionMissing";

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

  if (!hasToken) {
    return (
      <SessionMissing message="Your Telegram session is not active. Close and reopen the mini app from the bot." />
    );
  }

  if (error) {
    return (
      <PageScaffold>
        <PageHeader title="Servers" />
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
          <Link to="/" className="miniapp-back-link">
            Back
          </Link>
        </ActionRow>
      </PageScaffold>
    );
  }

  if (isLoading || !data) {
    return (
      <PageScaffold>
        <PageHeader title="Servers" />
        <Skeleton height={32} />
        <Skeleton height={120} />
      </PageScaffold>
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
    <PageScaffold>
      <PageHeader title="Servers" subtitle="90+ locations worldwide" />

      <PageSection title="Selection mode" description="Choose automatic routing or lock a preferred location.">
        <Panel className="card instrument-card instrument-card--inactive">
          <Body>
            {data.auto_select
              ? "Automatic server selection is enabled."
              : "Manual server preference is enabled."}
          </Body>
          <Caption>We prioritize healthy, low-load servers close to your region.</Caption>
          <ActionRow fullWidth>
            <Button
              size="sm"
              variant={data.auto_select ? "secondary" : "primary"}
              onClick={handleAutoSelect}
              loading={selectMutation.isPending && pendingServerId === "auto"}
              disabled={!isOnline || (selectMutation.isPending && pendingServerId === "auto")}
            >
              Use best server
            </Button>
          </ActionRow>
        </Panel>
      </PageSection>

      <PageSection title="Locations">
        <div className="server-grid">
          {data.items.map((server) => {
            const load = server.load_percent ?? 0;
            const isPending = selectMutation.isPending && pendingServerId === server.id;
            const code = (server.region ?? server.name ?? "??").slice(0, 2).toUpperCase();
            return (
              <Panel
                key={server.id}
                className={`card instrument-card ${server.is_current ? "instrument-card--active" : "instrument-card--inactive"} server-row-card`}
              >
                <span className="server-row-code">{code}</span>
                <div className="server-row-details">
                  <H3 as="h3" className="server-row-name tracking-trim data-truncate">
                    {server.name}
                  </H3>
                  <Caption className="server-row-meta" tabular>
                    {server.avg_ping_ms != null ? `${Math.round(server.avg_ping_ms)} ms` : "—"}
                  </Caption>
                </div>
                <div className="server-row-load">
                  <Caption className="server-row-load-value" tabular>
                    {Math.round(load)}% load
                  </Caption>
                  <ProgressBar
                    value={load}
                    max={100}
                    className="server-row-load-bar"
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
                  {server.is_current ? "Selected" : "Select"}
                </Button>
              </Panel>
            );
          })}
        </div>
      </PageSection>
    </PageScaffold>
  );
}
