import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Panel,
  Button,
  Skeleton,
  InlineAlert,
  useToast,
} from "@vpn-suite/shared/ui";
import type { WebAppServersResponse, WebAppServerItem } from "@vpn-suite/shared/types";
import { getWebappToken, webappApi } from "../api/client";

export function ServerSelectionPage() {
  const hasToken = !!getWebappToken();
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
      <div className="page-content">
        <h1 className="miniapp-page-title">Servers</h1>
        <InlineAlert
          variant="warning"
          title="Session missing"
          message="Your Telegram session is not active. Close and reopen the mini app from the bot."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <h1 className="miniapp-page-title">Servers</h1>
        <InlineAlert
          variant="error"
          title="Could not load servers"
          message="We could not load server list. Please try again later."
        />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="page-content">
        <h1 className="miniapp-page-title">Servers</h1>
        <Skeleton height={32} />
        <Skeleton height={120} />
      </div>
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
    <div className="page-content">
      <div className="miniapp-page-header">
        <div>
          <h1 className="miniapp-page-title">Servers</h1>
          <p className="miniapp-page-subtitle">
            90+ locations worldwide
          </p>
        </div>
      </div>
      <Panel className="card mb-lg">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-muted fs-sm mb-0">
              {data.auto_select
                ? "Automatic server selection is enabled."
                : "Manual server preference is enabled."}
            </p>
            <p className="fs-xs text-muted mt-xs mb-0">
              We prioritize healthy, low-load servers close to your region.
            </p>
          </div>
          <Button
            size="sm"
            variant={data.auto_select ? "secondary" : "primary"}
            onClick={handleAutoSelect}
            loading={selectMutation.isPending && pendingServerId === "auto"}
          >
            Use best server
          </Button>
        </div>
      </Panel>
      <div className="server-grid">
        {data.items.map((server) => {
          const load = server.load_percent ?? 0;
          const isPending = selectMutation.isPending && pendingServerId === server.id;
          const code = (server.region ?? server.name ?? "??").slice(0, 2).toUpperCase();
          return (
            <Panel key={server.id} className="card server-row-card">
              <span className="server-row-code">{code}</span>
              <div className="server-row-details">
                <h2 className="server-row-name">{server.name}</h2>
                <p className="server-row-meta">
                  {server.avg_ping_ms != null ? `${Math.round(server.avg_ping_ms)} ms` : "—"}
                </p>
              </div>
              <div className="server-row-load">
                <p className="server-row-load-value">{Math.round(load)}% load</p>
                <div className="server-row-load-bar">
                  <div className="server-row-load-fill" style={{ width: `${load}%` }} />
                </div>
              </div>
              <Button
                size="sm"
                variant={server.is_current ? "secondary" : "primary"}
                onClick={() => handleSelectServer(server)}
                loading={isPending}
                disabled={isPending}
              >
                {server.is_current ? "Selected" : "Select"}
              </Button>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

export default ServerSelectionPage;

