import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { WebAppSupportFaqResponse } from "@vpn-suite/shared";
import { webappApi, useWebappToken } from "@/api/client";
import { useSession, useTrackScreen, useTelemetry } from "@/hooks";
import { useI18n } from "@/hooks/useI18n";
import { useToast } from "@/design-system";
import type { StandardPageHeader, StandardPageState } from "@/page-models/types";
import { getActiveSubscription } from "@/page-models/helpers";
import { webappQueryKeys } from "@/lib";
import { getSupportContactHref } from "@/config/env";
import { telegramClient } from "@/lib/telegram/telegramCoreClient";
import {
  buildSupportContext,
  persistSupportContext,
  readPersistedSupportContext,
  useGuidanceContextId,
  type SupportContextPayload,
} from "../support-context";
import type { TranslationParams } from "@/lib/i18n";

/** Keep keys and order aligned with `apps/admin-api/app/api/v1/webapp.py` → `_WEBAPP_SUPPORT_FAQ_ITEMS`. */
const FALLBACK_SUPPORT_FAQ_KEYS: ReadonlyArray<{ title_key: string; body_key: string }> = [
  { title_key: "support.faq_item_connection_title", body_key: "support.faq_item_connection_body" },
  { title_key: "support.faq_item_install_title", body_key: "support.faq_item_install_body" },
  { title_key: "support.faq_item_restore_title", body_key: "support.faq_item_restore_body" },
  { title_key: "support.faq_item_device_title", body_key: "support.faq_item_device_body" },
  { title_key: "support.faq_item_billing_title", body_key: "support.faq_item_billing_body" },
  { title_key: "support.faq_item_privacy_title", body_key: "support.faq_item_privacy_body" },
  { title_key: "support.faq_item_support_title", body_key: "support.faq_item_support_body" },
  { title_key: "support.faq_item_slow_title", body_key: "support.faq_item_slow_body" },
  { title_key: "support.faq_item_cancel_title", body_key: "support.faq_item_cancel_body" },
  { title_key: "support.faq_item_data_title", body_key: "support.faq_item_data_body" },
] as const;

const TROUBLESHOOTER_STEPS = [
  {
    titleKey: "support.troubleshooter_step_access_title",
    bodyKey: "support.troubleshooter_step_access_body",
    nextLabelKey: "support.troubleshooter_step_access_next",
    backLabelKey: "onboarding.back",
  },
  {
    titleKey: "support.troubleshooter_step_device_title",
    bodyKey: "support.troubleshooter_step_device_body",
    nextLabelKey: "support.troubleshooter_step_device_next",
    backLabelKey: "onboarding.back",
  },
  {
    titleKey: "support.troubleshooter_step_refresh_title",
    bodyKey: "support.troubleshooter_step_refresh_body",
    nextLabelKey: "support.troubleshooter_step_refresh_next",
    backLabelKey: "onboarding.back",
  },
  {
    titleKey: "support.troubleshooter_step_support_title",
    bodyKey: "support.troubleshooter_step_support_body",
    nextLabelKey: "support.troubleshooter_step_support_next",
    backLabelKey: "onboarding.back",
  },
] as const;

function formatExpiresLabel(value: string | null, locale: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function buildCopyText(payload: SupportContextPayload, t: (key: string, params?: TranslationParams) => string) {
  const expiresAt = formatExpiresLabel(payload.subscription_expires_at, payload.locale);
  const subscriptionValue =
    payload.subscription_status === "active" && expiresAt
      ? `${payload.subscription_status} · ${expiresAt}`
      : payload.subscription_status;

  return [
    t("support.diagnostics_title"),
    `${t("support.diagnostics_context_label")}: ${payload.guidance_context_id}`,
    `${t("support.diagnostics_subscription_label")}: ${subscriptionValue}`,
    `${t("support.diagnostics_devices_label")}: ${payload.device_count}${payload.device_limit != null ? ` / ${payload.device_limit}` : ""}`,
    `${t("support.diagnostics_route_label")}: ${payload.current_route}`,
    `${t("support.diagnostics_last_action_label")}: ${payload.last_action}`,
    `${t("support.diagnostics_app_label")}: ${payload.app_version} (${payload.build_id})`,
    `${t("support.diagnostics_platform_label")}: ${payload.platform}`,
    `${t("support.diagnostics_locale_label")}: ${payload.locale}`,
    payload.latest_device_name ? `Latest device: ${payload.latest_device_name}` : null,
    payload.public_ip ? `Public IP: ${payload.public_ip}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildDiagnosticStats(
  payload: SupportContextPayload,
  t: (key: string, params?: TranslationParams) => string,
) {
  const expiresAt = formatExpiresLabel(payload.subscription_expires_at, payload.locale);
  const subscriptionValue =
    payload.subscription_status === "active" && expiresAt
      ? `${payload.subscription_status} · ${expiresAt}`
      : payload.subscription_status;
  return [
    { label: t("support.diagnostics_context_label"), value: payload.guidance_context_id },
    { label: t("support.diagnostics_subscription_label"), value: subscriptionValue },
    {
      label: t("support.diagnostics_devices_label"),
      value: payload.device_limit != null ? `${payload.device_count} / ${payload.device_limit}` : `${payload.device_count}`,
    },
    { label: t("support.diagnostics_route_label"), value: payload.current_route },
    { label: t("support.diagnostics_last_action_label"), value: payload.last_action },
    { label: t("support.diagnostics_app_label"), value: `${payload.app_version} (${payload.build_id})` },
    { label: t("support.diagnostics_platform_label"), value: payload.platform },
    { label: t("support.diagnostics_locale_label"), value: payload.locale },
  ];
}

export function useSupportPageModel() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const hasToken = !!useWebappToken();
  const { data, isLoading, error, refetch } = useSession(hasToken);
  const activeSub = getActiveSubscription(data);
  useTrackScreen("support", activeSub?.plan_id ?? null);
  const { track } = useTelemetry(activeSub?.plan_id ?? null);
  const { addToast } = useToast();
  const [step, setStep] = useState(0);
  const totalSteps = TROUBLESHOOTER_STEPS.length;
  const { t, locale } = useI18n();
  const guidanceContextId = useGuidanceContextId();
  const supportHref = getSupportContactHref();
  const platform = telegramClient.getPlatform();

  const faqQuery = useQuery<WebAppSupportFaqResponse>({
    queryKey: [...webappQueryKeys.supportFaq()],
    queryFn: () => webappApi.get<WebAppSupportFaqResponse>("/webapp/support/faq"),
    enabled: hasToken,
    retry: 1,
  });

  const refetchFaq = useCallback(() => {
    void queryClient.refetchQueries({ queryKey: [...webappQueryKeys.supportFaq()] });
  }, [queryClient]);

  const faqSource = useMemo(() => {
    const items = faqQuery.data?.items;
    if (items && items.length > 0) {
      return items;
    }
    return [...FALLBACK_SUPPORT_FAQ_KEYS];
  }, [faqQuery.data?.items]);

  const faqItems = useMemo(
    () => faqSource.map((item) => ({ title: t(item.title_key), body: t(item.body_key) })),
    [faqSource, t],
  );

  const header: StandardPageHeader = {
    title: t("support.header_title"),
    subtitle: t("support.header_subtitle"),
  };

  const faqBlocking = hasToken && !faqQuery.isFetched && (faqQuery.isPending || faqQuery.isFetching);

  const pageState: StandardPageState = !hasToken
    ? { status: "empty", title: t("common.session_missing_title") }
    : isLoading || faqBlocking
      ? { status: "loading" }
      : error
        ? {
            status: "error",
            title: t("common.could_not_load_title"),
            message: t("common.could_not_load_generic"),
            onRetry: () => {
              void refetch();
              void queryClient.refetchQueries({ queryKey: [...webappQueryKeys.supportFaq()] });
            },
          }
        : { status: "ready" };

  const hero = {
    title: t("support.hero_title"),
    subtitle: t("support.hero_subtitle"),
  };

  const supportContext = useMemo(() => {
    const persisted = readPersistedSupportContext();
    if (persisted) return persisted;
    return buildSupportContext({
      session: data,
      currentRoute: location.pathname,
      lastAction: "support_opened",
      platform,
      locale,
      guidanceContextId,
    });
  }, [data, guidanceContextId, location.pathname, platform, locale]);

  const diagnosticStats = useMemo(() => buildDiagnosticStats(supportContext, t), [supportContext, t]);
  const diagnosticCopyText = useMemo(() => buildCopyText(supportContext, t), [supportContext, t]);

  const copyDiagnostics = useCallback(async (): Promise<boolean> => {
    if (!navigator.clipboard?.writeText) {
      addToast(t("support.diagnostics_copy_failed"), "error");
      return false;
    }
    try {
      await navigator.clipboard.writeText(diagnosticCopyText);
      addToast(t("support.diagnostics_copied"), "success");
      return true;
    } catch {
      addToast(t("support.diagnostics_copy_failed"), "error");
      return false;
    }
  }, [addToast, diagnosticCopyText, t]);

  const contactSupport = useCallback(async () => {
    persistSupportContext({
      ...supportContext,
      last_action: "support_contact_opened",
      current_route: location.pathname,
    });
    await copyDiagnostics();
    if (supportHref) {
      telegramClient.openLink(supportHref);
    }
  }, [copyDiagnostics, location.pathname, supportContext, supportHref]);

  useEffect(() => {
    track("support_opened", {
      screen_name: "support",
      route: location.pathname,
      device_count: supportContext.device_count,
      device_limit: supportContext.device_limit ?? undefined,
      last_action: supportContext.last_action,
    });
  }, [location.pathname, supportContext.device_count, supportContext.device_limit, supportContext.last_action, track]);

  const currentStepAltLabel = step === 0 ? t("support.troubleshooter_step_access_alt") : undefined;

  return {
    header,
    pageState,
    hero,
    faqItems,
    refetchFaq,
    faqOffline: hasToken && faqQuery.isError,
    currentStep: {
      title: t(TROUBLESHOOTER_STEPS[step]?.titleKey ?? TROUBLESHOOTER_STEPS[0].titleKey),
      body: t(TROUBLESHOOTER_STEPS[step]?.bodyKey ?? TROUBLESHOOTER_STEPS[0].bodyKey),
      nextLabel: t(TROUBLESHOOTER_STEPS[step]?.nextLabelKey ?? TROUBLESHOOTER_STEPS[0].nextLabelKey),
      backLabel: t(TROUBLESHOOTER_STEPS[step]?.backLabelKey ?? TROUBLESHOOTER_STEPS[0].backLabelKey),
    },
    step,
    totalSteps,
    currentStepAltLabel,
    nextStep: () => setStep((value) => (value + 1 < totalSteps ? value + 1 : 0)),
    previousStep: step > 0 ? () => setStep((value) => value - 1) : undefined,
    supportContext,
    diagnosticStats,
    diagnosticCopyText,
    copyDiagnostics,
    contactSupport,
    supportHref,
  };
}
