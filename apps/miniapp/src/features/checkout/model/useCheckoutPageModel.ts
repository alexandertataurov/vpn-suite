import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  WebAppCreateInvoiceResponse,
  WebAppPaymentStatusOut,
} from "@vpn-suite/shared";
import { getMe, getPlans } from "@/api";
import { useWebappToken, webappApi } from "@/api/client";
import type { PlansResponse } from "@/api";
import {
  useHideKeyboard,
  useOnlineStatus,
  usePayments,
  useTelegramHaptics,
  useTelegramMainButton,
  useTelemetry,
  useTrackScreen,
} from "@/hooks";
import { useI18n } from "@/hooks/useI18n";
import { webappQueryKeys } from "@/lib";
import { getPreferredPaymentProvider } from "@/lib/payments/provider";
import type { PromoErrorCode } from "@/page-models/promoTypes";
import type { StandardPageHeader, StandardPageState } from "@/page-models/types";
import { formatPriceAmount } from "@/page-models/plan-helpers";

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

type PaymentPhase = "idle" | "creating_invoice" | "waiting" | "success" | "error" | "timeout";
type PromoStatus = "idle" | "validating" | "valid" | "invalid";
type PromoErrorAction = "clear" | "retry";

function shouldRetryPaymentStatusPoll(err: unknown): boolean {
  const e = err as { code?: string; statusCode?: number };
  if (e?.code === "NETWORK_UNREACHABLE" || e?.code === "TIMEOUT") return true;
  if (typeof e?.statusCode === "number") return e.statusCode >= 500;
  return false;
}

function resolvePromoValidationError(err: unknown): {
  key: string;
  action: PromoErrorAction;
  code: PromoErrorCode | null;
} {
  const e = err as Error & { code?: string };
  const code: PromoErrorCode | null =
    e?.code && ["PROMO_NOT_FOUND", "PROMO_INACTIVE", "PROMO_EXPIRED", "PROMO_PLAN_INELIGIBLE", "PROMO_ALREADY_USED", "PROMO_EXHAUSTED"].includes(e.code)
      ? (e.code as PromoErrorCode)
      : null;
  switch (e?.code) {
    case "PROMO_EXPIRED":
      return { key: "checkout.promo_error_PROMO_EXPIRED", action: "clear", code: "PROMO_EXPIRED" };
    case "PROMO_ALREADY_USED":
      return { key: "checkout.promo_error_PROMO_ALREADY_USED", action: "clear", code: "PROMO_ALREADY_USED" };
    case "PROMO_NOT_FOUND":
      return { key: "checkout.promo_error_PROMO_NOT_FOUND", action: "clear", code: "PROMO_NOT_FOUND" };
    case "PROMO_INACTIVE":
    case "PROMO_EXHAUSTED":
      return { key: "checkout.promo_error_PROMO_INACTIVE", action: "clear", code: code ?? "PROMO_INACTIVE" };
    case "PROMO_PLAN_INELIGIBLE":
      return { key: "checkout.promo_error_PROMO_PLAN_INELIGIBLE", action: "retry", code: "PROMO_PLAN_INELIGIBLE" };
    case "NETWORK_UNREACHABLE":
    case "TIMEOUT":
      return { key: "checkout.promo_error_network", action: "retry", code: null };
    default:
      return { key: "checkout.promo_error_invalid", action: "retry", code: null };
  }
}

export function useCheckoutPageModel() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const selectedPlanId = planId ?? "";
  const hasToken = !!useWebappToken();
  const isOnline = useOnlineStatus();
  const [promoCode, setPromoCode] = useState("");
  const [promoStatus, setPromoStatus] = useState<PromoStatus>("idle");
  const [promoErrorKey, setPromoErrorKey] = useState("");
  const [promoErrorCode, setPromoErrorCode] = useState<PromoErrorCode | null>(null);
  const [promoErrorAction, setPromoErrorAction] = useState<PromoErrorAction>("retry");
  const [promoPreview, setPromoPreview] = useState<{ description: string } | null>(null);
  const [discountXtr, setDiscountXtr] = useState<number | null>(null);
  const [discountedPriceXtr, setDiscountedPriceXtr] = useState<number | null>(null);
  const [displayLabel, setDisplayLabel] = useState<string | null>(null);
  const [confirmationStep, setConfirmationStep] = useState(false);
  const [phase, setPhase] = useState<PaymentPhase>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const paymentIdRef = useRef<string | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollAbortRef = useRef<AbortController | null>(null);
  const { impact, notify } = useTelegramHaptics();
  const { openInvoice } = usePayments();
  const hideKeyboard = useHideKeyboard();
  const { t, locale } = useI18n();
  const paymentProvider = getPreferredPaymentProvider();
  useTrackScreen("checkout", null);
  const { track } = useTelemetry(null);

  const navigateToNextStep = useCallback(async () => {
    const session = await queryClient.fetchQuery({
      queryKey: [...webappQueryKeys.me()],
      queryFn: getMe,
    });
    const target = session.routing?.recommended_route ?? "/";
    navigate(target, { replace: true });
  }, [navigate, queryClient]);

  const { data: plansData, isLoading: plansLoading, error: plansError, refetch: refetchPlans } = useQuery<PlansResponse>({
    queryKey: [...webappQueryKeys.plans()],
    queryFn: getPlans,
    enabled: hasToken && !!selectedPlanId,
  });

  const selectedPlan = plansData?.items?.find((plan) => plan.id === selectedPlanId);
  const isFreePlan = selectedPlan != null && Number(selectedPlan.price_amount) <= 0;
  const planDisplayName = selectedPlan?.name?.trim() || (planId ? `${planId.slice(0, 8)}···` : "N/A");
  const planPriceStars = selectedPlan != null && Number(selectedPlan.price_amount) > 0
    ? Math.round(Number(selectedPlan.price_amount))
    : null;
  const planCurrency = selectedPlan?.price_currency ?? "XTR";
  const basePlanAmount = selectedPlan != null && Number(selectedPlan.price_amount) > 0
    ? Math.round(Number(selectedPlan.price_amount))
    : 0;
  const appliedAmount = discountedPriceXtr != null ? Math.max(0, Math.round(discountedPriceXtr)) : basePlanAmount;
  const originalAmountRaw = selectedPlan != null ? Math.round(Number(selectedPlan.original_price_amount ?? 0)) : 0;
  const originalAmount = promoStatus === "valid"
    ? Math.max(basePlanAmount, originalAmountRaw)
    : originalAmountRaw > appliedAmount
      ? originalAmountRaw
      : 0;
  const priceLabel = formatPriceAmount(appliedAmount, planCurrency, locale);
  const originalPriceLabel = originalAmount > 0
    ? formatPriceAmount(originalAmount, planCurrency, locale)
    : null;
  const planDurationDays = selectedPlan?.duration_days ?? 30;
  const planDeviceLimit = selectedPlan?.device_limit ?? 1;

  const validatePromo = useMutation({
    mutationFn: async (): Promise<{ valid: true; discount_xtr: number; discounted_price_xtr: number; display_label: string }> => {
      if (!selectedPlanId) throw new Error("Plan is missing");
      return webappApi.post("/webapp/promo/validate", {
        code: promoCode.trim(),
        plan_id: selectedPlanId,
        payment_provider: paymentProvider ?? undefined,
      });
    },
    onMutate: () => setPromoStatus("validating"),
    onSuccess: (data) => {
      setPromoStatus("valid");
      setPromoErrorKey("");
      setPromoErrorCode(null);
      setPromoPreview({ description: data.display_label });
      setDiscountXtr(data.discount_xtr);
      setDiscountedPriceXtr(data.discounted_price_xtr);
      setDisplayLabel(data.display_label);
    },
    onError: (err) => {
      const resolved = resolvePromoValidationError(err);
      setPromoStatus("invalid");
      setPromoErrorKey(resolved.key);
      setPromoErrorCode(resolved.code);
      setPromoErrorAction(resolved.action);
      setPromoPreview(null);
      setDiscountXtr(null);
      setDiscountedPriceXtr(null);
      setDisplayLabel(null);
    },
  });

  const handlePromoRecovery = () => {
    if (promoErrorAction === "clear") {
      setPromoCode("");
      setPromoPreview(null);
      setPromoErrorKey("");
      setPromoErrorCode(null);
      setPromoErrorAction("retry");
      setPromoStatus("idle");
      setDiscountXtr(null);
      setDiscountedPriceXtr(null);
      setDisplayLabel(null);
      return;
    }
    if (!selectedPlanId || !promoCode.trim()) return;
    validatePromo.mutate();
  };

  const handlePromoRemove = () => {
    setPromoCode("");
    setPromoPreview(null);
    setPromoErrorKey("");
    setPromoErrorCode(null);
    setPromoErrorAction("retry");
    setPromoStatus("idle");
    setDiscountXtr(null);
    setDiscountedPriceXtr(null);
    setDisplayLabel(null);
  };

  const stopPolling = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    if (pollAbortRef.current) {
      pollAbortRef.current.abort();
      pollAbortRef.current = null;
    }
  }, []);

  const pollPaymentStatus = useCallback((pid: string) => {
    const start = Date.now();
    const doPoll = async () => {
      if (Date.now() - start >= POLL_TIMEOUT_MS) {
        setPhase("timeout");
        track("payment_fail", { plan_id: selectedPlanId, reason: "timeout" });
        notify("error");
        return;
      }
      try {
        pollAbortRef.current = new AbortController();
        const status = await webappApi.get<WebAppPaymentStatusOut>(`/webapp/payments/${pid}/status`, { signal: pollAbortRef.current.signal });
        if (status.status === "completed" || status.status === "succeeded") {
          stopPolling();
          setPhase("success");
          notify("success");
          track("payment_success", { plan_id: selectedPlanId });
          await queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
          await navigateToNextStep();
          return;
        }
        if (["failed", "cancelled", "expired", "refunded", "chargeback"].includes(status.status)) {
          stopPolling();
          setPhase("error");
          setErrorMessage(status.status === "expired" ? "Payment expired. Please create a new invoice." : "Payment was not completed.");
          notify("error");
          track("payment_fail", { plan_id: selectedPlanId, reason: status.status });
          return;
        }
      } catch (err: unknown) {
        if (pollAbortRef.current?.signal.aborted) return;
        if (shouldRetryPaymentStatusPoll(err)) {
          pollTimeoutRef.current = setTimeout(doPoll, POLL_INTERVAL_MS);
          return;
        }
        stopPolling();
        setPhase("error");
        const e = err as Error & { code?: string; statusCode?: number };
        setErrorMessage(
          e?.code === "NETWORK_UNREACHABLE" || e?.code === "TIMEOUT"
            ? t("checkout.network_unreachable_message")
            : e?.message || t("checkout.activate_failed_message"),
        );
        notify("error");
        track("payment_fail", {
          plan_id: selectedPlanId,
          reason:
            e?.code ??
            (typeof e?.statusCode === "number" ? `status_${e.statusCode}` : "status_poll_failed"),
        });
        return;
      }
      pollTimeoutRef.current = setTimeout(doPoll, POLL_INTERVAL_MS);
    };
    void doPoll();
  }, [navigateToNextStep, notify, queryClient, selectedPlanId, stopPolling, t, track]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const createInvoice = useMutation({
    mutationFn: async () => {
      if (!selectedPlanId) throw new Error("Plan is missing");
      const body: {
        plan_id: string;
        promo_code?: string;
        payment_provider?: "telegram_stars" | "platega";
      } = { plan_id: selectedPlanId };
      if (promoStatus === "valid" && promoCode.trim()) body.promo_code = promoCode.trim();
      if (paymentProvider) body.payment_provider = paymentProvider;
      return webappApi.post<WebAppCreateInvoiceResponse>("/webapp/payments/create-invoice", body);
    },
    onMutate: () => {
      setPhase("creating_invoice");
      setErrorMessage("");
    },
    onSuccess: (data) => {
      const freeActivated = data.free_activation === true || (Number(data.star_count) === 0 && !(data.invoice_link ?? data.invoice_url));
      if (freeActivated) {
        setPhase("success");
        notify("success");
        track("payment_success", { plan_id: selectedPlanId });
        void queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
        void navigateToNextStep();
        return;
      }
      const invoiceLink = data.invoice_link ?? data.invoice_url ?? "";
      paymentIdRef.current = data.payment_id;
      if (invoiceLink) {
        track("invoice_opened", { plan_id: selectedPlanId });
        openInvoice(invoiceLink);
        setPhase("waiting");
        track("payment_start", { plan_id: selectedPlanId });
        pollPaymentStatus(data.payment_id);
      } else {
        setPhase("waiting");
        track("payment_start", { plan_id: selectedPlanId });
        if (data.payment_id) pollPaymentStatus(data.payment_id);
        else setPhase("error");
      }
    },
    onError: (err: unknown) => {
      setPhase("error");
      const e = err as Error & { code?: string; statusCode?: number; details?: { message?: string } };
      const msg = e?.details?.message ?? e?.message ?? t("checkout.activate_failed_message");
      setErrorMessage(
        e?.code === "NETWORK_UNREACHABLE" || e?.code === "TIMEOUT"
          ? t("checkout.network_unreachable_message")
          : msg,
      );
      notify("error");
      track("payment_fail", { plan_id: selectedPlanId, reason: "api_error" });
    },
  });

  const handleRetry = () => {
    setPhase("idle");
    setErrorMessage("");
    paymentIdRef.current = null;
  };

  const handleBack = () => {
    setConfirmationStep(false);
  };

  const handleContinue = () => {
    hideKeyboard();
    impact("medium");
    track("cta_click", { cta_name: "checkout_continue", screen_name: "checkout", plan_id: selectedPlanId });
    track("checkout_started", { plan_id: selectedPlanId });
    setConfirmationStep(true);
  };

  const handlePay = () => {
    hideKeyboard();
    impact("medium");
    track("cta_click", { cta_name: "pay_with_telegram_stars", screen_name: "checkout", plan_id: selectedPlanId });
    createInvoice.mutate();
  };

  // Native Telegram MainButton hidden on checkout; use in-page MissionPrimaryButton only
  useTelegramMainButton(null);

  const header: StandardPageHeader = {
    title: t("checkout.header_title"),
    subtitle: t("checkout.header_subtitle"),
  };

  const plansFetched = !plansLoading && !plansError;
  const pageState: StandardPageState = !hasToken
    ? { status: "empty", title: t("common.session_missing_title") }
    : selectedPlanId && plansLoading
      ? { status: "loading" }
      : selectedPlanId && plansError
        ? {
            status: "error",
            title: t("common.could_not_load_plan"),
            message: t("checkout.could_not_load_plan_message"),
            onRetry: () => void refetchPlans(),
          }
        : plansFetched && selectedPlanId && !selectedPlan
          ? {
              status: "error",
              title: t("checkout.plan_not_found_title"),
              message: t("checkout.plan_not_found_message", { planId: selectedPlanId }),
            }
          : { status: "ready" };

  return {
    header,
    pageState,
    hasToken,
    isOnline,
    selectedPlanId,
    selectedPlan,
    planId,
    isFreePlan,
    planDisplayName,
    planPriceStars,
    priceLabel,
    originalPriceLabel,
    promoCode,
    promoStatus,
    promoErrorKey,
    promoErrorCode,
    promoErrorAction,
    promoPreview,
    discountXtr,
    discountedPriceXtr,
    displayLabel,
    phase,
    errorMessage,
    isCreatingInvoice: createInvoice.isPending,
    isValidatingPromo: validatePromo.isPending,
    setPromoCode: (value: string) => {
      setPromoCode(value);
      if (promoErrorKey || promoStatus === "valid" || promoStatus === "invalid") {
        setPromoErrorKey("");
        setPromoErrorCode(null);
        setPromoErrorAction("retry");
        setPromoStatus("idle");
        setPromoPreview(null);
        setDiscountXtr(null);
        setDiscountedPriceXtr(null);
        setDisplayLabel(null);
      }
    },
    applyPromo: () => validatePromo.mutate(),
    handlePromoRecovery,
    handlePromoRemove,
    handlePay,
    handleRetry,
    confirmationStep,
    handleContinue,
    handleBack,
    planDurationDays,
    planDeviceLimit,
  };
}
