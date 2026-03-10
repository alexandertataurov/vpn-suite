import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WebAppServerItem, WebAppServersResponse } from "@vpn-suite/shared";
import { useLocation, useNavigate } from "react-router-dom";
import { useWebappToken, webappApi } from "@/api/client";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSession } from "@/hooks/useSession";
import { useTrackScreen } from "@/hooks/useTrackScreen";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useToast } from "@/design-system";
import { webappQueryKeys } from "@/lib/query-keys/webapp.query-keys";
import type { StandardPageHeader, StandardPageState, StandardSectionBadge } from "./types";
import { getActiveSubscription } from "./helpers";

export function useServerSelectionPageModel() {
  const hasToken = !!useWebappToken();
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const [pendingServerId, setPendingServerId] = useState<string | null>(null);
  const returnTo =
    typeof (location.state as { from?: string } | null)?.from === "string" &&
    (location.state as { from?: string } | null)?.from?.startsWith("/")
      ? (location.state as { from?: string } | null)!.from!
      : "/devices";

  const { data: session } = useSession(hasToken);
  const activeSub = getActiveSubscription(session);
  useTrackScreen("servers", activeSub?.plan_id ?? null);
  const { track } = useTelemetry(activeSub?.plan_id ?? null);

  const { data, isLoading, error } = useQuery<WebAppServersResponse>({
    queryKey: [...webappQueryKeys.servers()],
    queryFn: () => webappApi.get<WebAppServersResponse>("/webapp/servers"),
    enabled: hasToken,
  });

  const selectMutation = useMutation({
    mutationFn: (payload: { server_id?: string; mode?: "auto" | "manual" }) =>
      webappApi.post("/webapp/servers/select", payload),
    onSuccess: (_data, variables) => {
      addToast("Server preference updated", "success");
      queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.servers()] });
      track("server_switched", {
        screen_name: "servers",
        server_id: variables.server_id,
      });
      navigate(returnTo, { replace: true });
    },
    onError: () => {
      addToast("Could not update server preference", "error");
    },
    onSettled: () => setPendingServerId(null),
  });

  const header: StandardPageHeader = {
    title: "Server location",
    subtitle: "Choose where new configs should route by default",
  };

  const pageState: StandardPageState = !hasToken
    ? { status: "empty", title: "Session missing" }
    : !isOnline
      ? {
          status: "error",
          title: "Offline",
          message: "You appear to be offline. Check your connection and try again.",
        }
      : error
        ? {
            status: "error",
            title: "Could not load servers",
            message: "We could not load server list. Please try again later.",
            onRetry: () => queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.servers()] }),
          }
        : isLoading || !data
          ? { status: "loading" }
          : { status: "ready" };

  const locationsBadge: StandardSectionBadge = {
    tone: "neutral",
    label: `${data?.items.length ?? 0} locations`,
    emphasizeNumeric: true,
  };

  return {
    header,
    pageState,
    data,
    isOnline,
    pendingServerId,
    isMutating: selectMutation.isPending,
    locationsBadge,
    handleAutoSelect: () => {
      setPendingServerId("auto");
      selectMutation.mutate({ mode: "auto" });
    },
    handleSelectServer: (server: WebAppServerItem) => {
      setPendingServerId(server.id);
      selectMutation.mutate({ server_id: server.id, mode: "manual" });
    },
  };
}
