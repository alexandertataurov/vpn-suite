import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { UserAccessResponse } from "@vpn-suite/shared";
import { getUserAccess } from "@/api";
import { useWebappToken } from "@/api/client";
import { webappQueryKeys } from "@/lib";
import { formatBytes } from "@/lib";
import { formatDate } from "@/lib/utils/format";
import { useI18n } from "@/hooks/useI18n";
import type { StandardPageState } from "@/page-models/types";
import { periodLabelForHeroLocalized, sanitizePlanDisplayName } from "@/page-models/plan-helpers";

export type AccessStatus = UserAccessResponse["status"];

export interface AccessUIConfig {
  title: string;
  description: string;
  ctaLabel: string;
  ctaDisabled: boolean;
  ctaAction: () => void;
  showDevices: boolean;
  showExpiry: boolean;
  expiryLabel?: string;
}

function buildAccessUiMap(t: (key: string, params?: Record<string, string | number | boolean>) => string): Record<
  Exclude<AccessStatus, "loading" | "error">,
  Omit<AccessUIConfig, "ctaAction"> & { ctaRoute?: string }
> {
  return {
  no_plan: {
    title: t("home.access_state_no_plan_title"),
    description: t("home.access_state_no_plan_desc"),
    ctaLabel: t("home.access_state_no_plan_cta"),
    ctaDisabled: false,
    ctaRoute: "/plan",
    showDevices: false,
    showExpiry: false,
  },
  needs_device: {
    title: t("home.access_state_needs_device_title"),
    description: t("home.access_state_needs_device_desc"),
    ctaLabel: t("home.access_state_needs_device_cta"),
    ctaDisabled: false,
    ctaRoute: "/devices",
    showDevices: true,
    showExpiry: false,
  },
  generating_config: {
    title: t("home.access_state_generating_title"),
    description: t("home.access_state_generating_desc"),
    ctaLabel: "",
    ctaDisabled: true,
    showDevices: false,
    showExpiry: false,
  },
  ready: {
    title: t("home.access_state_ready_title"),
    description: t("home.access_state_ready_desc"),
    ctaLabel: t("home.access_state_ready_cta"),
    ctaDisabled: false,
    ctaRoute: "/devices",
    showDevices: true,
    showExpiry: true,
    expiryLabel: t("home.expiry_valid_until"),
  },
  expired: {
    title: t("home.access_state_expired_title"),
    description: t("home.access_state_expired_desc"),
    ctaLabel: t("home.access_state_expired_cta"),
    ctaDisabled: false,
    ctaRoute: "/restore-access",
    showDevices: false,
    showExpiry: true,
    expiryLabel: t("home.expiry_expired_on"),
  },
  device_limit: {
    title: t("home.access_state_device_limit_title"),
    description: t("home.access_state_device_limit_desc"),
    ctaLabel: t("home.access_state_device_limit_cta"),
    ctaDisabled: false,
    ctaRoute: "/devices",
    showDevices: true,
    showExpiry: false,
  },
  };
}

function resolveDateLocale(locale: "en" | "ru"): string {
  return locale === "ru" ? "ru-RU" : "en-US";
}

function formatExpiry(expiresAt: string | null, locale: "en" | "ru"): string {
  if (!expiresAt) return "";
  return formatDate(expiresAt, resolveDateLocale(locale));
}

export type PillChipVariant = "beta" | "active" | "expiring" | "expired";

function daysUntil(expiresAt: string): number | null {
  const exp = new Date(expiresAt);
  if (Number.isNaN(exp.getTime())) {
    return null;
  }
  const now = new Date();
  return Math.ceil((exp.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

export function getPillChipForAccess(
  status: AccessStatus,
  hasPlan: boolean,
  expiresAt: string | null,
  t: (key: string, params?: Record<string, string | number | boolean>) => string,
): { variant: PillChipVariant; label: string } | null {
  if (status === "no_plan" || !hasPlan) return { variant: "beta", label: t("home.status_beta") };
  if (status === "expired") return { variant: "expired", label: t("home.expired_label") };
  if (expiresAt) {
    const days = daysUntil(expiresAt);
    if (days != null) {
      if (days <= 0) return { variant: "expired", label: t("home.expired_label") };
      if (days <= 14) {
        return {
          variant: "expiring",
          label: `${t("home.status_pro")} · ${t("home.badge_days_left", { count: days })}`,
        };
      }
    }
  }
  return { variant: "active", label: t("home.status_pro") };
}

export function useAccessHomePageModel() {
  const hasToken = !!useWebappToken();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, locale } = useI18n();
  const ACCESS_UI_MAP = buildAccessUiMap(t);

  const accessQuery = useQuery({
    queryKey: [...webappQueryKeys.access()],
    queryFn: getUserAccess,
    enabled: hasToken,
  });

  const data = accessQuery.data;
  const isLoading = accessQuery.isLoading;
  const isError = accessQuery.isError;
  const pageState: StandardPageState = !hasToken
    ? { status: "empty", title: t("home.page_state_empty_title") }
    : isError
      ? {
          status: "error",
          title: t("home.page_error_title"),
          message: t("home.page_error_message"),
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
  const dateLocale = resolveDateLocale(locale);
  const expiryValue = data?.expires_at ? formatExpiry(data.expires_at, locale) : "";
  const expiryLabel = uiConfig?.expiryLabel ?? t("home.expiry_valid_until");

  const pillChip =
    data != null
      ? getPillChipForAccess(status, data.has_plan, data.expires_at, t)
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
    (status === "needs_device" ||
      status === "ready" ||
      status === "expired" ||
      status === "device_limit" ||
      status === "generating_config");

  const renewsLabel = status === "expired" ? t("home.expired_label") : t("home.renews_label");
  const planName = sanitizePlanDisplayName(
    data?.plan_name?.trim() ?? data?.plan_id ?? t("home.plan_name_pro"),
    locale,
  );
  const planPeriod = data?.plan_duration_days
    ? periodLabelForHeroLocalized(data.plan_duration_days, locale).toLowerCase()
    : "";
  const planDisplayName = [planName, planPeriod].filter(Boolean).join(" ").trim();
  const renewsValue = data?.expires_at ? formatExpiry(data.expires_at, locale) : "—";

  const expiryDateShort = data?.expires_at ? formatDate(data.expires_at, dateLocale) : "";

  const subscriptionSubtitle =
    status === "expired"
      ? t("home.subscription_plan_generic", { plan: planDisplayName || planName })
      : planHeroStatus === "expiring"
        ? (
            expiryDateShort
              ? t("home.subscription_expires_on_plan", { date: expiryDateShort, plan: planDisplayName || planName })
              : t("home.subscription_plan_generic", { plan: planDisplayName || planName })
          )
        : t("home.subscription_renews_on_plan", { date: renewsValue, plan: planDisplayName || planName });

  const subscriptionLabel = status === "expired" ? t("home.subscription_renew_label") : t("home.subscription_label");
  const devicesSubtitle =
    status === "expired"
      ? t("home.devices_paused", { count: data?.devices_used ?? 0 })
      : data?.devices_used != null && data?.device_limit != null
        ? t("home.devices_active", { used: data.devices_used, limit: data.device_limit })
        : t("home.devices_none_added");
  const trafficValue = hasPlan ? formatBytes(data?.traffic_used_bytes ?? 0, { digits: 1 }) : "—";

  const planHeroData = showPlanHero && data
    ? {
        eyebrow: t("home.plan_eyebrow"),
        planName,
        subtitle: planPeriod ? t("home.plan_subtitle", { count: data.device_limit ?? 0, period: planPeriod }) : undefined,
        status: planHeroStatus,
        stats: [
          {
            label: t("home.plan_stat_devices"),
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
          { label: t("home.plan_stat_traffic"), value: trafficValue, tone: "default" as const },
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
