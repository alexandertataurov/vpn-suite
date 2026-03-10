import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { webappApi } from "@/api/client";
import { useTrackScreen } from "@/hooks/useTrackScreen";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useSession } from "@/hooks/useSession";
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
        eyebrow: "Access",
        title: "No active plan",
        subtitle: "Choose a plan before issuing a config or connecting in your VPN app.",
        edge: "e-r" as const,
        glow: "g-red" as const,
      }
    : activeDevices.length === 0
      ? {
          eyebrow: "Setup",
          title: "No device config yet",
          subtitle: "Issue a device first, then import the config in your VPN app.",
          edge: "e-a" as const,
          glow: "g-amber" as const,
        }
      : connectionConfirmed
        ? {
            eyebrow: "Setup",
            title: "Setup confirmed",
            subtitle: "At least one device has completed setup in the VPN app.",
            edge: "e-g" as const,
            glow: "g-green" as const,
          }
        : {
            eyebrow: "Setup",
            title: "Setup pending",
            subtitle: "Import the config in your VPN app, connect there, then confirm here.",
            edge: "e-a" as const,
            glow: "g-amber" as const,
          };

  const primaryAction = !activeSub
    ? { label: "Choose plan", to: "/plan" }
    : activeDevices.length === 0
      ? { label: "Add device", to: "/devices/issue" }
      : connectionConfirmed
        ? { label: "Manage devices", to: "/devices" }
        : null;

  return {
    header: {
      title: "VPN setup status",
      subtitle: latestDevice?.device_name ?? "Access and device setup",
    },
    summary,
    description: !activeSub
      ? "The mini app manages access and configs. The VPN connection itself happens in your native VPN app."
      : activeDevices.length === 0
        ? "Issue a device to receive a config, then continue setup in your VPN app."
        : connectionConfirmed
          ? "The app can confirm setup completion, but it does not directly control the VPN connection."
          : "Use this screen only after you have imported the config and connected in your native VPN app.",
    pageState,
    primaryAction,
    latestDeviceName: latestDevice?.device_name ?? "your device",
    showConfirmAction: Boolean(activeSub && latestDevice && !connectionConfirmed),
    isConfirming: confirmMutation.isPending,
    confirmConnected,
  };
}
