import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { webappApi } from "@/api/client";
import { useSession } from "@/hooks/useSession";
import { webappQueryKeys } from "@/lib/query-keys/webapp.query-keys";
import { getActiveDevices } from "./helpers";

export function useConnectStatusPageModel() {
  const queryClient = useQueryClient();
  const { data: session } = useSession(true);

  const activeDevices = getActiveDevices(session);
  const latestDevice = activeDevices[0];

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!latestDevice) throw new Error("No device to confirm");
      return webappApi.post<{ status: string }>(
        `/webapp/devices/${latestDevice.id}/confirm-connected`,
      );
    },
    onSuccess: () => {
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

  const pageState =
    !session?.user || activeDevices.length === 0
      ? { status: "empty" as const }
      : { status: "ready" as const };

  return {
    header: {
      title: "Confirm connection",
      subtitle: latestDevice?.device_name ?? "Device",
    },
    description:
      "Once you've imported the config and connected to the VPN, confirm here.",
    pageState,
    isConfirming: confirmMutation.isPending,
    confirmConnected,
  };
}
