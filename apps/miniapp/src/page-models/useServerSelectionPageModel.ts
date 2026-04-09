import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WebAppServerItem, WebAppServersResponse } from "@vpn-suite/shared";
import { useLocation, useNavigate } from "react-router-dom";
import { useWebappToken, webappApi } from "@/api/client";
import { useOnlineStatus, useSession, useTrackScreen, useTelemetry } from "@/hooks";
import { useToast } from "@/design-system";
import { useI18n } from "@/hooks/useI18n";
import { webappQueryKeys } from "@/lib";
import type { StandardPageHeader, StandardPageState } from "./types";
import { getActiveSubscription } from "./helpers";

export function useServerSelectionPageModel() {
  const hasToken = !!useWebappToken();
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const { t } = useI18n();
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
      addToast(t("server_selection.toast_updated"), "success");
      queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.servers()] });
      track("server_switched", {
        screen_name: "servers",
        server_id: variables.server_id,
      });
      navigate(returnTo, { replace: true });
    },
    onError: () => {
      addToast(t("server_selection.toast_failed"), "error");
    },
    onSettled: () => setPendingServerId(null),
  });

  const header: StandardPageHeader = {
    title: t("server_selection.header_title"),
    subtitle: t("server_selection.header_subtitle"),
  };

  const pageState: StandardPageState = !hasToken
    ? { status: "empty", title: t("common.session_missing_title") }
    : !isOnline
      ? {
          status: "error",
          title: t("server_selection.offline_title"),
          message: t("server_selection.offline_message"),
        }
      : error
        ? {
            status: "error",
            title: t("server_selection.load_error_title"),
            message: t("server_selection.load_error_message"),
            onRetry: () => queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.servers()] }),
          }
        : isLoading || !data
          ? { status: "loading" }
          : { status: "ready" };

  return {
    header,
    pageState,
    data,
    isOnline,
    pendingServerId,
    isMutating: selectMutation.isPending,
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
