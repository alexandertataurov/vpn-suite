import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { formatDateDisplay, type UserAccessResponse } from "@vpn-suite/shared";
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
    description: "Manage your devices and subscription here. Connect in AmneziaVPN.",
    ctaLabel: "Manage Devices",
    ctaDisabled: false,
    ctaRoute: "/devices",
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
  return formatDateDisplay(expiresAt);
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

  const hasPlan = data?.has_plan ?? false;
  const planHeroStatus =
    pillChip?.variant === "expired"
      ? ("expired" as const)
      : pillChip?.variant === "expiring"
        ? ("expiring" as const)
        : ("active" as const);

  const showNewUserHero = status === "no_plan" || !hasPlan;
  const showPlanHero =
    hasPlan &&
    status !== "generating_config" &&
    (status === "needs_device" ||
      status === "ready" ||
      status === "expired" ||
      status === "device_limit");

  const renewsLabel = status === "expired" ? "Expired" : "Renews";
  const renewsValue =
    status === "expired" && data?.expires_at
      ? formatExpiry(data.expires_at)
      : data?.expires_at
        ? (() => {
            const days = daysUntil(data.expires_at);
            if (days > 0 && days <= 14) return `${days}d`;
            return formatDateDisplay(data.expires_at);
          })()
        : "—";

  const expiryDateShort =
    data?.expires_at ? formatDateDisplay(data.expires_at) : "";

  const subscriptionSubtitle =
    status === "expired"
      ? "Pro annual"
      : planHeroStatus === "expiring"
        ? (expiryDateShort ? `Expires ${expiryDateShort} · Pro annual` : "Pro annual")
        : `Pro annual · renews ${renewsValue}`;

  const subscriptionLabel = "Subscription";
  const devicesSubtitle =
    status === "expired"
      ? `${data?.devices_used ?? 0} devices · access paused`
      : data?.devices_used != null && data?.device_limit != null
        ? `${data.devices_used} of ${data.device_limit} active`
        : "None added yet";

  const planHeroData = showPlanHero && data
    ? {
        eyebrow: "YOUR PLAN",
        planName: "Pro",
        subtitle: `${data.device_limit ?? 0} devices · annual`,
        status: planHeroStatus,
        stats: [
          {
            label: "DEVICES",
            value: String(data.devices_used),
            dim: ` / ${data.device_limit ?? 0}`,
            tone: "default" as const,
          },
          {
            label: renewsLabel,
            value: renewsValue,
            tone:
              planHeroStatus === "expired"
                ? ("expired" as const)
                : planHeroStatus === "expiring"
                  ? ("expiring" as const)
                  : ("default" as const),
          },
          { label: "TRAFFIC", value: "∞", tone: "default" as const },
        ] as const,
      }
    : null;

  const showRenewalBanner = hasPlan && (planHeroStatus === "expiring" || planHeroStatus === "expired");
  const showNoDeviceCallout = status === "needs_device";
  const showNoDeviceCalloutAboveBanner =
    planHeroStatus === "expiring" && (data?.devices_used ?? 0) === 0;

  const daysLeft = data?.expires_at ? daysUntil(data.expires_at) : null;
  const devicesFull =
    data != null &&
    data.device_limit != null &&
    data.devices_used === data.device_limit;

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
    showNewUserHero,
    showPlanHero,
    planHeroData,
    showRenewalBanner,
    showNoDeviceCallout,
    showNoDeviceCalloutAboveBanner,
    subscriptionSubtitle,
    subscriptionLabel,
    devicesSubtitle,
    daysLeft,
    devicesFull,
    expiryDateShort,
    onRetry: () => void queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.access()] }),
  };
}
