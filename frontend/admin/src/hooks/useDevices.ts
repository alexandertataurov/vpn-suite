import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { useApiMutation } from "./useApiMutation";
import type {
  DeviceOut,
  DeviceList,
  DeviceSummaryOut,
  AdminRotatePeerResponse,
} from "@/shared/types/admin-api";

/** GET /devices/config-health response shape. */
export interface ConfigHealthOut {
  by_reconciliation: Record<string, number>;
  no_telemetry_count: number;
}

/**
 * Purpose: Fetch single device by id.
 * Used in: DevicesPage detail drawer.
 */
export function useGetDevice(deviceId: string | null) {
  return useApiQuery<DeviceOut>(
    ["devices", "detail", deviceId!],
    `/devices/${deviceId!}`,
    { enabled: !!deviceId, retry: 0 }
  );
}

/**
 * Purpose: Fetch paginated device list.
 * Used in: DevicesPage table.
 */
export function useGetDeviceList(params: { limit: number; offset: number }) {
  const path = `/devices?limit=${params.limit}&offset=${params.offset}`;
  return useApiQuery<DeviceList>(["devices", "list", params.limit, params.offset], path, { retry: 1 });
}

/**
 * Purpose: Fetch device summary counts.
 * Used in: DevicesPage KPIs.
 */
export function useGetDeviceSummary() {
  return useApiQuery<DeviceSummaryOut>(["devices", "summary"], "/devices/summary", { retry: 1 });
}

/**
 * Purpose: Fetch config-health aggregates.
 * Used in: DevicesPage config health widget.
 */
export function useGetDeviceConfigHealth() {
  return useApiQuery<ConfigHealthOut>(
    ["devices", "config-health"],
    "/devices/config-health?limit=500",
    { retry: 1, staleTime: 60_000 }
  );
}

/**
 * Purpose: Invalidate device-related queries.
 * Used in: DevicesPage after reconcile/revoke/reissue/suspend/resume.
 */
export function useDevicesInvalidate() {
  const queryClient = useQueryClient();
  return function invalidateDevices(deviceId?: string | null) {
    void queryClient.invalidateQueries({ queryKey: ["devices", "summary"] });
    void queryClient.invalidateQueries({ queryKey: ["devices", "list"] });
    void queryClient.invalidateQueries({ queryKey: ["devices", "config-health"] });
    if (deviceId) {
      void queryClient.invalidateQueries({ queryKey: ["devices", "detail", deviceId] });
    }
  };
}

/**
 * Purpose: POST /devices/:id/reconcile; invalidates devices (and optionally servers).
 * Used in: DevicesPage reconcile button.
 */
export function useDeviceReconcile() {
  const invalidateDevices = useDevicesInvalidate();
  return useApiMutation({
    mutationFn: (api) => (deviceId: string) => api.post(`/devices/${deviceId}/reconcile`),
    onSuccess: () => {
      invalidateDevices();
    },
  });
}

/**
 * Purpose: POST /devices/:id/revoke with confirm_token; invalidates devices.
 * Used in: DevicesPage revoke modal.
 */
export function useDeviceRevoke() {
  const invalidateDevices = useDevicesInvalidate();
  return useApiMutation({
    mutationFn: (api) => (payload: { deviceId: string; confirm_token: string }) =>
      api.post(`/devices/${payload.deviceId}/revoke`, { confirm_token: payload.confirm_token }),
    onSuccess: () => {
      invalidateDevices();
    },
  });
}

/**
 * Purpose: POST /devices/:id/reissue; returns new config; invalidates devices.
 * Used in: DevicesPage reissue flow.
 */
export function useDeviceReissue() {
  const invalidateDevices = useDevicesInvalidate();
  return useApiMutation({
    mutationFn: (api) => (deviceId: string) =>
      api.post<AdminRotatePeerResponse>(`/devices/${deviceId}/reissue`),
    onSuccess: () => {
      invalidateDevices();
    },
  });
}
