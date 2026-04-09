import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { WebAppSupportFaqResponse } from "@vpn-suite/shared";
import { webappApi, useWebappToken } from "@/api/client";
import { useSession, useTrackScreen, useTelemetry } from "@/hooks";
import type { StandardPageHeader, StandardPageState } from "./types";
import { getActiveSubscription } from "./helpers";
import { useI18n } from "@/hooks/useI18n";
import { webappQueryKeys } from "@/lib";

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

export function useSupportPageModel() {
  const queryClient = useQueryClient();
  const hasToken = !!useWebappToken();
  const { data, isLoading, error, refetch } = useSession(hasToken);
  const activeSub = getActiveSubscription(data);
  useTrackScreen("support", activeSub?.plan_id ?? null);
  const { track } = useTelemetry(activeSub?.plan_id ?? null);
  const [step, setStep] = useState(0);
  const totalSteps = TROUBLESHOOTER_STEPS.length;
  const { t } = useI18n();

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

  const faqBlocking =
    hasToken && !faqQuery.isFetched && (faqQuery.isPending || faqQuery.isFetching);

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

  /** Only for step 0: label for the "No" path (e.g. navigate to plan). */
  const currentStepAltLabel =
    step === 0 ? t("support.troubleshooter_step_access_alt") : undefined;

  useEffect(() => {
    track("support_opened", { screen_name: "support" });
  }, [track]);

  return {
    header,
    pageState,
    hero,
    faqItems,
    refetchFaq,
    /** True when `/webapp/support/faq` failed; UI still shows `faqItems` from fallback keys. */
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
  };
}
