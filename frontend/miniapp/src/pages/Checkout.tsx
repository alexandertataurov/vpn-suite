import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { WebAppCreateInvoiceResponse, WebAppPaymentStatusOut } from "@vpn-suite/shared";
import {
  FallbackScreen,
  Input,
  PageFrame,
  Skeleton,
  PageSection,
  MissionAlert,
  MissionCard,
  MissionChip,
  MissionPrimaryButton,
  MissionSecondaryButton,
  MissionSecondaryLink,
  SessionMissing,
} from "@/design-system";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { webappApi, useWebappToken } from "@/api/client";
import { useTelegramMainButton } from "@/hooks/useTelegramMainButton";
import { useTelegramHaptics } from "@/hooks/useTelegramHaptics";
import { useHideKeyboard } from "@/hooks/useHideKeyboard";
import { useTrackScreen } from "@/hooks/useTrackScreen";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { usePayments } from "@/hooks/features/usePayments";

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

type PaymentPhase = "idle" | "creating_invoice" | "waiting" | "success" | "error" | "timeout";
type PromoErrorAction = "clear" | "retry";

function resolvePromoValidationError(err: unknown): { message: string; action: PromoErrorAction } {
  const e = err as Error & { code?: string };
  switch (e?.code) {
    case "PROMO_EXPIRED":
      return {
        message: "Promo expired for this plan. Remove the code and continue checkout.",
        action: "clear",
      };
    case "PROMO_ALREADY_USED":
      return {
        message: "This promo was already used on your account. Remove it and continue checkout.",
        action: "clear",
      };
    case "PROMO_NOT_FOUND":
      return {
        message: "Promo code not found for this plan. Check spelling or remove it to continue.",
        action: "clear",
      };
    case "NETWORK_UNREACHABLE":
    case "TIMEOUT":
      return {
        message: "Cannot validate promo right now. Check your connection and try again.",
        action: "retry",
      };
    default:
      return {
        message: "Promo code is invalid for the selected plan. Check the code and try again.",
        action: "retry",
      };
  }
}

export function CheckoutPage() {
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

  const {
    data: plansData,
    isLoading: plansLoading,
    error: plansError,
    refetch: refetchPlans,
  } = useQuery({
    queryKey: ["webapp", "plans"],
    queryFn: () => webappApi.get<{ items: { id: string; price_amount: number }[] }>("/webapp/plans"),
    enabled: hasToken && !!selectedPlanId,
  });
  const selectedPlan = plansData?.items?.find((p) => p.id === selectedPlanId);
  const isFreePlan = selectedPlan != null && Number(selectedPlan.price_amount) <= 0;

  const validatePromo = useMutation({
    mutationFn: async (): Promise<{ valid: boolean; description?: string }> => {
      if (!selectedPlanId) throw new Error("Plan is missing");
      return webappApi.post<{ valid: boolean; description?: string }>("/webapp/promo/validate", {
        code: promoCode.trim(),
        plan_id: selectedPlanId,
      });
    },
    onSuccess: (data: { valid: boolean; description?: string }) => {
      if (data.valid) {
        setPromoPreview(data.description ? { description: data.description } : null);
        setPromoError("");
      } else {
        setPromoError("Promo code is invalid for the selected plan. Check the code and try again.");
        setPromoErrorAction("retry");
      }
    },
    onError: (err: unknown) => {
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

  const pollPaymentStatus = useCallback(
    (pid: string) => {
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
          const status = await webappApi.get<WebAppPaymentStatusOut>(
            `/webapp/payments/${pid}/status`,
            { signal: pollAbortRef.current.signal },
          );
          if (status.status === "completed") {
            stopPolling();
            setPhase("success");
            notify("success");
            track("payment_success", { plan_id: selectedPlanId });
            queryClient.invalidateQueries({ queryKey: ["webapp", "me"] });
            navigate("/devices", { replace: true });
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
      doPoll();
    },
    [selectedPlanId, stopPolling, notify, track, queryClient, navigate],
  );

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
    onSuccess: (data: WebAppCreateInvoiceResponse) => {
      const freeActivated =
        data.free_activation === true ||
        (Number(data.star_count) === 0 && !(data.invoice_link ?? data.invoice_url));
      if (freeActivated) {
        queryClient.invalidateQueries({ queryKey: ["webapp", "me"] });
        setPhase("success");
        notify("success");
        track("payment_success", { plan_id: selectedPlanId });
        navigate("/devices", { replace: true });
        return;
      }
      const invoiceLink = data.invoice_link ?? data.invoice_url ?? "";
      paymentIdRef.current = data.payment_id;
      if (invoiceLink) {
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
      setErrorMessage(
        e?.code === "NETWORK_UNREACHABLE" || e?.code === "TIMEOUT"
          ? "Cannot reach server. Check your connection and try again."
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

  const handlePay = () => {
    hideKeyboard();
    impact("medium");
    track("cta_click", {
      cta_name: "pay_with_telegram_stars",
      screen_name: "checkout",
      plan_id: selectedPlanId,
    });
    createInvoice.mutate();
  };

  const paymentPhaseTone =
    phase === "success"
      ? "green"
      : phase === "error" || phase === "timeout"
        ? "red"
        : phase === "waiting" || phase === "creating_invoice"
          ? "amber"
          : "neutral";
  const paymentPhaseLabel =
    phase === "success"
      ? "Success"
      : phase === "error"
        ? "Failed"
        : phase === "timeout"
          ? "Timeout"
        : phase === "waiting" || phase === "creating_invoice"
          ? "Pending"
          : "Ready";
  const headerSubtitle = `Plan ${planId ?? "N/A"}`;

  useTelegramMainButton(null);

  if (!hasToken) {
    return <SessionMissing />;
  }

  const plansFetched = !plansLoading && !plansError;
  if (selectedPlanId && plansLoading) {
    return (
      <PageFrame title="Checkout" subtitle={headerSubtitle}>
        <MissionCard tone="blue" className="module-card">
          <Skeleton className="skeleton-h-md" />
          <Skeleton className="skeleton-h-2xl" />
        </MissionCard>
      </PageFrame>
    );
  }

  if (selectedPlanId && plansError) {
    return (
      <FallbackScreen
        title="Could not load plan"
        message="We could not load plan details. Please try again or go back to choose a plan."
        onRetry={() => refetchPlans()}
      />
    );
  }

  if (plansFetched && selectedPlanId && !selectedPlan) {
    return (
      <PageFrame title="Checkout" subtitle={headerSubtitle}>
        <MissionCard tone="red" className="module-card">
          <MissionAlert
            tone="error"
            title="Plan not found"
            message={`Plan "${selectedPlanId}" is not available. Please choose a plan from the list.`}
          />
          <div className="btn-row">
            <MissionSecondaryLink to="/plan">Back to plan</MissionSecondaryLink>
          </div>
        </MissionCard>
      </PageFrame>
    );
  }

  return (
    <PageFrame title="Checkout" subtitle={headerSubtitle}>
      <PageSection
        title="Payment"
        description="Activate your subscription securely via Telegram."
        action={<MissionChip tone={paymentPhaseTone} className="section-meta-chip">{paymentPhaseLabel}</MissionChip>}
      >
        <MissionCard tone="blue" className="module-card">
          <div className="data-grid">
            <div className="data-cell">
              <div className="dc-key">Plan ID</div>
              <div className="dc-val teal miniapp-tnum">{planId}</div>
            </div>
            <div className="data-cell">
              <div className="dc-key">Mode</div>
              <div className="dc-val">{isFreePlan ? "Activation" : "Stars payment"}</div>
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              validatePromo.mutate();
            }}
            className="form-row"
          >
            <Input
              placeholder="Promo code"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value);
                if (promoError) {
                  setPromoError("");
                  setPromoErrorAction("retry");
                }
              }}
            />
            <MissionSecondaryButton
              type="submit"
              disabled={!selectedPlanId || !promoCode.trim() || validatePromo.isPending}
            >
              {validatePromo.isPending ? "Checking…" : "Apply"}
            </MissionSecondaryButton>
          </form>

          {promoPreview && (
            <MissionAlert tone="info" title="Promo applied" message={promoPreview.description} />
          )}
          {promoError && (
            <>
              <MissionAlert tone="error" title="Promo code issue" message={promoError} />
              <div className="btn-row">
                <MissionSecondaryButton
                  type="button"
                  onClick={handlePromoRecovery}
                  disabled={validatePromo.isPending}
                >
                  {promoErrorAction === "clear" ? "Remove code" : "Try again"}
                </MissionSecondaryButton>
              </div>
            </>
          )}

          <div className="btn-row">
            <MissionPrimaryButton
              onClick={handlePay}
              disabled={!planId || !hasToken || !isOnline || phase === "waiting" || phase === "creating_invoice"}
            >
              {createInvoice.isPending ? (
                <>
                  <svg className="spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <circle cx="12" cy="12" r="8" strokeOpacity="0.35" />
                    <path d="M20 12a8 8 0 0 0-8-8" />
                  </svg>
                  <span>Preparing…</span>
                </>
              ) : (
                isFreePlan ? "Activate plan" : "Pay with Telegram Stars"
              )}
            </MissionPrimaryButton>
          </div>

          {phase === "success" && (
            <MissionAlert
              tone="success"
              title="Payment successful"
              message="Your plan has been activated. You can go back to Home or Plan."
            />
          )}
          {(phase === "waiting" || createInvoice.isPending) && (
            <MissionAlert
              tone="info"
              title="Waiting for payment"
              message="Complete the Stars payment in the Telegram sheet to activate your subscription."
            />
          )}
          {(phase === "error" || phase === "timeout") && (
            <>
              <MissionAlert
                tone="error"
                title={phase === "timeout" ? "Payment timed out" : "Payment failed"}
                message={phase === "timeout"
                  ? "Payment did not complete in time. You can try again."
                  : errorMessage || "We could not complete the payment. Please try again or contact support."}
              />
              <div className="btn-row">
                <MissionSecondaryButton onClick={handleRetry}>
                  Try again
                </MissionSecondaryButton>
              </div>
            </>
          )}
        </MissionCard>
      </PageSection>
    </PageFrame>
  );
}
