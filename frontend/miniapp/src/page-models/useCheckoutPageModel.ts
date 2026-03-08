import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  WebAppCreateInvoiceResponse,
  WebAppMeResponse,
  WebAppPaymentStatusOut,
} from "@vpn-suite/shared";
import { webappApi, useWebappToken } from "@/api/client";
import { useHideKeyboard } from "@/hooks/useHideKeyboard";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { usePayments } from "@/hooks/features/usePayments";
import { useTelegramHaptics } from "@/hooks/useTelegramHaptics";
import { useTelegramMainButton } from "@/hooks/useTelegramMainButton";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useTrackScreen } from "@/hooks/useTrackScreen";
import { webappQueryKeys } from "@/lib/query-keys/webapp.query-keys";
import type { StandardPageHeader, StandardPageState, StandardSectionBadge } from "./types";

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

type PaymentPhase = "idle" | "creating_invoice" | "waiting" | "success" | "error" | "timeout";
type PromoErrorAction = "clear" | "retry";

function resolvePromoValidationError(err: unknown): { message: string; action: PromoErrorAction } {
  const e = err as Error & { code?: string };
  switch (e?.code) {
    case "PROMO_EXPIRED":
      return { message: "Promo expired for this plan. Remove the code and continue checkout.", action: "clear" };
    case "PROMO_ALREADY_USED":
      return { message: "This promo was already used on your account. Remove it and continue checkout.", action: "clear" };
    case "PROMO_NOT_FOUND":
      return { message: "Promo code not found for this plan. Check spelling or remove it to continue.", action: "clear" };
    case "NETWORK_UNREACHABLE":
    case "TIMEOUT":
      return { message: "Cannot validate promo right now. Check your connection and try again.", action: "retry" };
    default:
      return { message: "Promo code is invalid for the selected plan. Check the code and try again.", action: "retry" };
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
  const [promoError, setPromoError] = useState("");
  const [promoErrorAction, setPromoErrorAction] = useState<PromoErrorAction>("retry");
  const [promoPreview, setPromoPreview] = useState<{ description: string } | null>(null);
  const [confirmationStep, setConfirmationStep] = useState(false);
  const [phase, setPhase] = useState<PaymentPhase>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const paymentIdRef = useRef<string | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollAbortRef = useRef<AbortController | null>(null);
  const { impact, notify } = useTelegramHaptics();
  const { openInvoice } = usePayments();
  const hideKeyboard = useHideKeyboard();
  useTrackScreen("checkout", null);
  const { track } = useTelemetry(null);

  const navigateToNextStep = useCallback(async () => {
    const session = await queryClient.fetchQuery({
      queryKey: [...webappQueryKeys.me()],
      queryFn: () => webappApi.get<WebAppMeResponse>("/webapp/me"),
    });
    navigate(session.routing?.recommended_route ?? "/plan", { replace: true });
  }, [navigate, queryClient]);

  const { data: plansData, isLoading: plansLoading, error: plansError, refetch: refetchPlans } = useQuery({
    queryKey: [...webappQueryKeys.plans()],
    queryFn: () => webappApi.get<{ items: { id: string; name?: string; duration_days?: number; price_amount: number; device_limit?: number }[] }>("/webapp/plans"),
    enabled: hasToken && !!selectedPlanId,
  });

  const selectedPlan = plansData?.items?.find((plan) => plan.id === selectedPlanId);
  const isFreePlan = selectedPlan != null && Number(selectedPlan.price_amount) <= 0;
  const planDisplayName = selectedPlan?.name?.trim() || (planId ? `${planId.slice(0, 8)}···` : "N/A");
  const planPriceStars = selectedPlan != null && Number(selectedPlan.price_amount) > 0 ? `⭐${Math.round(Number(selectedPlan.price_amount))}` : null;
  const planDurationDays = selectedPlan?.duration_days ?? 30;
  const planDeviceLimit = selectedPlan?.device_limit ?? 1;

  const validatePromo = useMutation({
    mutationFn: async (): Promise<{ valid: boolean; description?: string }> => {
      if (!selectedPlanId) throw new Error("Plan is missing");
      return webappApi.post<{ valid: boolean; description?: string }>("/webapp/promo/validate", {
        code: promoCode.trim(),
        plan_id: selectedPlanId,
      });
    },
    onSuccess: (data) => {
      if (data.valid) {
        setPromoPreview(data.description ? { description: data.description } : null);
        setPromoError("");
      } else {
        setPromoError("Promo code is invalid for the selected plan. Check the code and try again.");
        setPromoErrorAction("retry");
      }
    },
    onError: (err) => {
      const resolved = resolvePromoValidationError(err);
      setPromoError(resolved.message);
      setPromoErrorAction(resolved.action);
    },
  });

  const handlePromoRecovery = () => {
    if (promoErrorAction === "clear") {
      setPromoCode("");
      setPromoPreview(null);
      setPromoError("");
      setPromoErrorAction("retry");
      return;
    }
    if (!selectedPlanId || !promoCode.trim()) return;
    validatePromo.mutate();
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
        if (status.status === "completed") {
          stopPolling();
          setPhase("success");
          notify("success");
          track("payment_success", { plan_id: selectedPlanId });
          await queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
          await navigateToNextStep();
          return;
        }
        if (status.status === "failed" || status.status === "cancelled") {
          stopPolling();
          setPhase("error");
          setErrorMessage("Payment was not completed.");
          notify("error");
          track("payment_fail", { plan_id: selectedPlanId, reason: status.status });
          return;
        }
      } catch {
        if (!pollAbortRef.current?.signal.aborted) {
          pollTimeoutRef.current = setTimeout(doPoll, POLL_INTERVAL_MS);
        }
        return;
      }
      pollTimeoutRef.current = setTimeout(doPoll, POLL_INTERVAL_MS);
    };
    void doPoll();
  }, [navigateToNextStep, notify, queryClient, selectedPlanId, stopPolling, track]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const createInvoice = useMutation({
    mutationFn: async () => {
      if (!selectedPlanId) throw new Error("Plan is missing");
      const body: { plan_id: string; promo_code?: string } = { plan_id: selectedPlanId };
      if (promoCode.trim()) body.promo_code = promoCode.trim();
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
      const msg = e?.details?.message ?? e?.message ?? "Could not activate. Please try again.";
      setErrorMessage(e?.code === "NETWORK_UNREACHABLE" || e?.code === "TIMEOUT" ? "Cannot reach server. Check your connection and try again." : msg);
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
    setConfirmationStep(true);
  };

  const handlePay = () => {
    hideKeyboard();
    impact("medium");
    track("cta_click", { cta_name: "pay_with_telegram_stars", screen_name: "checkout", plan_id: selectedPlanId });
    createInvoice.mutate();
  };

  const paymentPhaseTone = phase === "success"
    ? "green"
    : phase === "error" || phase === "timeout"
      ? "red"
      : phase === "waiting" || phase === "creating_invoice"
        ? "amber"
        : "neutral";
  const paymentPhaseLabel = phase === "success"
    ? "Success"
    : phase === "error"
      ? "Failed"
      : phase === "timeout"
        ? "Timeout"
        : phase === "waiting" || phase === "creating_invoice"
          ? "Pending"
          : "Ready";

  useTelegramMainButton(null);

  const header: StandardPageHeader = {
    title: "Checkout",
    subtitle: planDisplayName,
  };

  const plansFetched = !plansLoading && !plansError;
  const pageState: StandardPageState = !hasToken
    ? { status: "empty", title: "Session missing" }
    : selectedPlanId && plansLoading
      ? { status: "loading" }
      : selectedPlanId && plansError
        ? {
            status: "error",
            title: "Could not load plan",
            message: "We could not load plan details. Please try again or go back to choose a plan.",
            onRetry: () => void refetchPlans(),
          }
        : plansFetched && selectedPlanId && !selectedPlan
          ? {
              status: "error",
              title: "Plan not found",
              message: `Plan "${selectedPlanId}" is not available. Please choose a plan from the list.`,
            }
          : { status: "ready" };

  const paymentBadge: StandardSectionBadge = {
    tone: paymentPhaseTone,
    label: paymentPhaseLabel,
  };

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
    promoCode,
    promoError,
    promoErrorAction,
    promoPreview,
    phase,
    errorMessage,
    paymentBadge,
    isCreatingInvoice: createInvoice.isPending,
    isValidatingPromo: validatePromo.isPending,
    setPromoCode: (value: string) => {
      setPromoCode(value);
      if (promoError) {
        setPromoError("");
        setPromoErrorAction("retry");
      }
    },
    applyPromo: () => validatePromo.mutate(),
    handlePromoRecovery,
    handlePay,
    handleRetry,
    confirmationStep,
    handleContinue,
    handleBack,
    planDurationDays,
    planDeviceLimit,
  };
}
