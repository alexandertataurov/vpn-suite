import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { webappApi } from "@/api/client";
import { useTrackScreen } from "@/hooks/useTrackScreen";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useSession } from "@/hooks/useSession";
import { useI18n } from "@/hooks/useI18n";
import { webappQueryKeys } from "@/lib/query-keys/webapp.query-keys";
import {
  getActiveDevices,
  getActiveSubscription,
  getLatestActiveDevice,
  hasConfirmedConnection,
} from "./helpers";

export function useConnectStatusPageModel() {
  const queryClient = useQueryClient();
  const { data: session } = useSession(true);
  const { t } = useI18n();

  const activeDevices = getActiveDevices(session);
  const latestDevice = getLatestActiveDevice(session);
  const activeSub = getActiveSubscription(session);
  const activeSubId = activeSub?.plan_id ?? null;
  const connectionConfirmed = hasConfirmedConnection(session);
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

  const pageState = !session?.user
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
    ? { label: t("home.primary_choose_plan"), to: "/plan" }
    : activeDevices.length === 0
      ? { label: t("home.primary_add_device"), to: "/devices/issue" }
      : connectionConfirmed
        ? { label: t("home.primary_manage_devices"), to: "/devices" }
        : null;

  return {
    header: {
      title: t("connect_status.header_title"),
      subtitle: latestDevice?.device_name ?? t("connect_status.header_subtitle_fallback"),
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
