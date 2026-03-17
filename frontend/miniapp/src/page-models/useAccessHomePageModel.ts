import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { UserAccessResponse } from "@vpn-suite/shared";
import { getUserAccess } from "@/api";
import { useWebappToken } from "@/api/client";
import { webappQueryKeys } from "@/lib";
import type { StandardPageState } from "./types";

export type AccessStatus = UserAccessResponse["status"];

export interface AccessUIConfig {
  title: string;
  description: string;
  ctaLabel: string;
  ctaDisabled: boolean;
  ctaAction: () => void;
  showDevices: boolean;
  showExpiry: boolean;
  expiryLabel?: "Valid until" | "Expired on";
}

const ACCESS_UI_MAP: Record<
  Exclude<AccessStatus, "loading" | "error">,
  Omit<AccessUIConfig, "ctaAction"> & { ctaRoute?: string }
> = {
  no_plan: {
    title: "No active plan",
    description: "Choose a plan to get VPN access",
    ctaLabel: "Choose Plan",
    ctaDisabled: false,
    ctaRoute: "/plan",
    showDevices: false,
    showExpiry: false,
  },
  needs_device: {
    title: "Add your device",
    description: "You need to add a device to generate your VPN configuration",
    ctaLabel: "Add Device",
    ctaDisabled: false,
    ctaRoute: "/devices",
    showDevices: true,
    showExpiry: false,
  },
  generating_config: {
    title: "Generating configuration",
    description: "This usually takes a few seconds",
    ctaLabel: "",
    ctaDisabled: true,
    showDevices: false,
    showExpiry: false,
  },
  ready: {
    title: "Your VPN is ready",
    description: "Open your configuration in AmneziaVPN",
    ctaLabel: "Open in AmneziaVPN",
    ctaDisabled: false,
    showDevices: true,
    showExpiry: true,
    expiryLabel: "Valid until",
  },
  expired: {
    title: "Access expired",
    description: "Renew your plan to continue using VPN",
    ctaLabel: "Renew Access",
    ctaDisabled: false,
    ctaRoute: "/restore-access",
    showDevices: false,
    showExpiry: true,
    expiryLabel: "Expired on",
  },
  device_limit: {
    title: "Device limit reached",
    description: "Remove a device to add a new one",
    ctaLabel: "Manage Devices",
    ctaDisabled: false,
    ctaRoute: "/devices",
    showDevices: true,
    showExpiry: false,
  },
};

function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) return "";
  const d = new Date(expiresAt);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export type PillChipVariant = "beta" | "active" | "expiring" | "expired";

function daysUntil(expiresAt: string): number {
  const now = new Date();
  const exp = new Date(expiresAt);
  return Math.ceil((exp.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

export function getPillChipForAccess(
  status: AccessStatus,
  hasPlan: boolean,
  expiresAt: string | null
): { variant: PillChipVariant; label: string } | null {
  if (status === "no_plan" || !hasPlan) return { variant: "beta", label: "Beta" };
  if (status === "expired") return { variant: "expired", label: "Expired" };
  if (!hasPlan) return { variant: "beta", label: "Beta" };
  if (expiresAt) {
    const days = daysUntil(expiresAt);
    if (days <= 0) return { variant: "expired", label: "Expired" };
    if (days <= 14) return { variant: "expiring", label: `PRO · ${days}d left` };
  }
  return { variant: "active", label: "PRO" };
}

export function useAccessHomePageModel() {
  const hasToken = !!useWebappToken();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const accessQuery = useQuery({
    queryKey: [...webappQueryKeys.access()],
    queryFn: getUserAccess,
    enabled: hasToken,
  });

  const data = accessQuery.data;
  const isLoading = accessQuery.isLoading;
  const isError = accessQuery.isError;
  const pageState: StandardPageState = !hasToken
    ? { status: "empty", title: "Session missing" }
    : isError
      ? {
          status: "error",
          title: "Something went wrong",
          message: "We couldn't load your access",
          onRetry: () => void queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.access()] }),
        }
      : isLoading
        ? { status: "loading" }
        : { status: "ready" };

  const status: AccessStatus = data?.status ?? (isLoading ? "loading" : "error");
  const baseConfig = status in ACCESS_UI_MAP ? ACCESS_UI_MAP[status as keyof typeof ACCESS_UI_MAP] : null;

  const uiConfig: AccessUIConfig | null = baseConfig
    ? {
        ...baseConfig,
        ctaAction: () => {
          if (status === "ready" && data?.amnezia_vpn_key) {
            window.open(data.amnezia_vpn_key);
            return;
          }
          const route = baseConfig.ctaRoute;
          if (route) navigate(route);
        },
      }
    : null;

  const showDevices = (uiConfig?.showDevices ?? false) && data != null && data.device_limit != null;
  const showExpiry =
    (uiConfig?.showExpiry ?? false) &&
    data != null &&
    data.expires_at != null &&
    (status !== "ready" || data.config_ready === true);
  const devicesValue =
    data && data.device_limit != null ? `${data.devices_used} / ${data.device_limit}` : "";
  const expiryValue = data?.expires_at ? formatExpiry(data.expires_at) : "";
  const expiryLabel = uiConfig?.expiryLabel ?? "Valid until";

  const pillChip =
    data != null
      ? getPillChipForAccess(status, data.has_plan, data.expires_at)
      : null;

  return {
    pageState,
    status,
    data,
    uiConfig,
    showDevices,
    showExpiry,
    devicesValue,
    expiryValue,
    expiryLabel,
    pillChip,
    onRetry: () => void queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.access()] }),
  };
}
