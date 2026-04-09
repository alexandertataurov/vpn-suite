import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWebappToken, webappApi } from "@/api/client";
import { useTrackScreen, useTelemetry, useSession } from "@/hooks";
import { useI18n } from "@/hooks";
import { webappQueryKeys } from "@/lib";
import {
  getActiveDevices,
  getActiveSubscription,
  getLiveConnection,
  getLatestActiveDevice,
  hasConfirmedConnection,
} from "./helpers";

export function useConnectStatusPageModel() {
  const queryClient = useQueryClient();
  const hasToken = !!useWebappToken();
  const { data: session, isPending, isError, refetch } = useSession(hasToken);
  const { t } = useI18n();

  const activeDevices = getActiveDevices(session);
  const latestDevice = getLatestActiveDevice(session);
  const activeSub = getActiveSubscription(session);
  const activeSubId = activeSub?.plan_id ?? null;
  const connectionConfirmed = hasConfirmedConnection(session);
  const liveConnected = getLiveConnection(session)?.status === "connected";
  useTrackScreen("connect-status", activeSubId ?? null);
  const { track } = useTelemetry(activeSubId ?? null);

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!latestDevice) throw new Error("No device to confirm");
      return webappApi.post<{ status: string }>(
        `/webapp/devices/${latestDevice.id}/confirm-connected`,
      );
    },
    onSuccess: () => {
      track("connect_confirmed", { screen_name: "connect-status" });
      void queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
    },
  });

  const confirmConnected = useCallback(async (): Promise<boolean> => {
    if (!latestDevice) return false;
    try {
      await confirmMutation.mutateAsync();
      return true;
    } catch {
      return false;
    }
  }, [latestDevice, confirmMutation]);

  const pageState = !hasToken
    ? { status: "empty" as const }
    : isPending
      ? { status: "loading" as const }
      : isError
        ? {
            status: "error" as const,
            title: t("common.could_not_load_title"),
            message: t("common.could_not_load_generic"),
            onRetry: () => void refetch(),
          }
        : !session?.user
          ? { status: "empty" as const }
          : { status: "ready" as const };

  const summary = !activeSub
    ? {
        eyebrow: t("connect_status.summary_access_eyebrow"),
        title: t("connect_status.summary_no_plan_title"),
        subtitle: t("connect_status.summary_no_plan_subtitle"),
        edge: "e-r" as const,
        glow: "g-red" as const,
      }
      : activeDevices.length === 0
        ? {
            eyebrow: t("connect_status.summary_setup_eyebrow"),
            title: t("connect_status.summary_no_device_title"),
            subtitle: t("connect_status.summary_no_device_subtitle"),
            edge: "e-a" as const,
            glow: "g-amber" as const,
          }
      : liveConnected
        ? {
            eyebrow: t("connect_status.summary_setup_eyebrow"),
            title: t("connect_status.summary_live_title"),
            subtitle: t("connect_status.summary_live_subtitle"),
            edge: "e-g" as const,
            glow: "g-green" as const,
          }
      : connectionConfirmed
        ? {
            eyebrow: t("connect_status.summary_setup_eyebrow"),
            title: t("connect_status.summary_confirmed_title"),
            subtitle: t("connect_status.summary_confirmed_subtitle"),
            edge: "e-g" as const,
            glow: "g-green" as const,
          }
        : {
            eyebrow: t("connect_status.summary_setup_eyebrow"),
            title: t("connect_status.summary_pending_title"),
            subtitle: t("connect_status.summary_pending_subtitle"),
            edge: "e-a" as const,
            glow: "g-amber" as const,
          };

  const primaryAction = !activeSub
    ? { kind: "route" as const, label: t("home.primary_choose_plan"), to: "/plan" }
    : activeDevices.length === 0
      ? { kind: "route" as const, label: t("onboarding.go_to_devices"), to: "/devices" }
      : { kind: "route" as const, label: t("onboarding.go_to_devices"), to: "/devices" };

  return {
    header: {
      title: t("connect_status.header_title"),
      subtitle: t("connect_status.header_subtitle"),
    },
    summary,
    description: !activeSub
      ? t("connect_status.description_no_plan")
      : activeDevices.length === 0
        ? t("connect_status.description_no_device")
        : connectionConfirmed
          ? t("connect_status.description_confirmed")
          : t("connect_status.description_pending"),
    pageState,
    primaryAction,
    latestDeviceName: latestDevice?.device_name ?? t("connect_status.latest_device_fallback"),
    showConfirmAction: Boolean(activeSub && latestDevice && !connectionConfirmed),
    isConfirming: confirmMutation.isPending,
    confirmConnected,
  };
}
