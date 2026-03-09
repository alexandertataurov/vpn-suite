import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WebAppServerItem, WebAppServersResponse } from "@vpn-suite/shared";
import { useWebappToken, webappApi } from "@/api/client";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSession } from "@/hooks/useSession";
import { useTrackScreen } from "@/hooks/useTrackScreen";
import { useToast } from "@/design-system";
import { webappQueryKeys } from "@/lib/query-keys/webapp.query-keys";
import type { StandardPageHeader, StandardPageState, StandardSectionBadge } from "./types";
import { getActiveSubscription } from "./helpers";

export function useServerSelectionPageModel() {
  const hasToken = !!useWebappToken();
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [pendingServerId, setPendingServerId] = useState<string | null>(null);

  const { data: session } = useSession(hasToken);
  const activeSub = getActiveSubscription(session);
  useTrackScreen("servers", activeSub?.plan_id ?? null);

  const { data, isLoading, error } = useQuery<WebAppServersResponse>({
    queryKey: [...webappQueryKeys.servers()],
    queryFn: () => webappApi.get<WebAppServersResponse>("/webapp/servers"),
    enabled: hasToken,
  });

  const selectMutation = useMutation({
    mutationFn: (payload: { server_id?: string; mode?: "auto" | "manual" }) => webappApi.post("/webapp/servers/select", payload),
    onSuccess: () => {
      addToast("Server preference updated", "success");
      queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.servers()] });
    },
    onError: () => {
      addToast("Could not update server preference", "error");
    },
    onSettled: () => setPendingServerId(null),
  });

  const header: StandardPageHeader = {
    title: "Servers",
    subtitle: "Choose route and location",
  };

  const pageState: StandardPageState = !hasToken
    ? { status: "empty", title: "Session missing" }
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
    label: `${data?.items.length ?? 0} nodes`,
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
