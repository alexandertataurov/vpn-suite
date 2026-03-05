import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { WebAppCreateInvoiceResponse, WebAppPaymentStatusOut } from "@/lib/types";
import {
  Panel,
  Input,
  Button,
  ButtonLink,
  InlineAlert,
  PageFrame,
  Skeleton,
  PageSection,
  ActionRow,
} from "../ui";
import { SessionMissing, FallbackScreen } from "@/components";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { webappApi, useWebappToken } from "../api/client";
import { useTelegramMainButton } from "../hooks/useTelegramMainButton";
import { useTelegramHaptics } from "../hooks/useTelegramHaptics";
import { useHideKeyboard } from "../hooks/useHideKeyboard";
import { useTrackScreen } from "../hooks/useTrackScreen";
import { useTelemetry } from "../hooks/useTelemetry";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { usePayments } from "../hooks/features/usePayments";

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

type PaymentPhase = "idle" | "creating_invoice" | "waiting" | "success" | "error" | "timeout";

export function CheckoutPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const selectedPlanId = planId ?? "";
  const hasToken = !!useWebappToken();
  const isOnline = useOnlineStatus();
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
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
      } else setPromoError("Invalid code");
    },
    onError: () => setPromoError("Invalid code"),
  });

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

  const paymentPhaseChipClass =
    phase === "success"
      ? "cg"
      : phase === "error" || phase === "timeout"
        ? "cr"
        : phase === "waiting" || phase === "creating_invoice"
          ? "ca"
          : "cn";
  const paymentPhaseLabel =
    phase === "success"
      ? "SUCCESS"
      : phase === "error"
        ? "FAILED"
        : phase === "timeout"
          ? "TIMEOUT"
        : phase === "waiting" || phase === "creating_invoice"
          ? "PENDING"
          : "READY";
  const headerSubtitle = `Plan ${planId ?? "N/A"}`;
  const backToPlanLink = (
    <ActionRow>
      <Link to="/plan" className="link-interactive page-anchor-link">BACK TO PLAN</Link>
    </ActionRow>
  );

  useTelegramMainButton(null);

  if (!hasToken) {
    return <SessionMissing />;
  }

  const plansFetched = !plansLoading && !plansError;
  if (selectedPlanId && plansLoading) {
    return (
      <PageFrame title="Payment Checkout" subtitle={headerSubtitle}>
        {backToPlanLink}
        <Panel className="card edge et">
          <Skeleton className="skeleton-h-md" />
          <Skeleton className="skeleton-h-2xl" />
        </Panel>
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
      <PageFrame title="Payment Checkout" subtitle={headerSubtitle}>
        {backToPlanLink}
        <Panel className="card edge et">
          <InlineAlert
            variant="error"
            title="Plan not found"
            message={`Plan "${selectedPlanId}" is not available. Please choose a plan from the list.`}
          />
          <ActionRow fullWidth>
            <ButtonLink to="/plan" variant="secondary" size="md">
              BACK TO PLAN
            </ButtonLink>
          </ActionRow>
        </Panel>
      </PageFrame>
    );
  }

  return (
    <PageFrame title="Payment Checkout" subtitle={headerSubtitle}>
      {backToPlanLink}

      <PageSection
        title="PAYMENT AUTHORIZATION"
        description="Activate your subscription securely via Telegram."
        action={<span className={`chip section-meta-chip ${paymentPhaseChipClass}`}>{paymentPhaseLabel}</span>}
      >
        <Panel variant="surface" className="card edge et module-card">
          <p className="type-meta miniapp-tnum">Plan ID: {planId}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              validatePromo.mutate();
            }}
            className="form-row"
          >
            <Input placeholder="Promo code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              disabled={!selectedPlanId || !promoCode.trim() || validatePromo.isPending}
            >
              APPLY
            </Button>
          </form>

          {promoPreview && (
            <InlineAlert variant="info" title="Promo applied" message={promoPreview.description} />
          )}
          {promoError && (
            <InlineAlert variant="error" title="Invalid promo code" message={promoError} />
          )}

          <ActionRow fullWidth>
            <Button
              variant="primary"
              onClick={handlePay}
              loading={createInvoice.isPending}
              size="lg"
              disabled={!planId || !hasToken || !isOnline || phase === "waiting" || phase === "creating_invoice"}
            >
              {isFreePlan ? "ACTIVATE PLAN" : "PAY WITH TELEGRAM STARS"}
            </Button>
          </ActionRow>

          {phase === "success" && (
            <InlineAlert
              variant="info"
              title="Payment successful"
              message="Your plan has been activated. You can go back to Home or Plan."
            />
          )}
          {(phase === "waiting" || createInvoice.isPending) && (
            <InlineAlert
              variant="info"
              title="Waiting for payment"
              message="Complete the Stars payment in the Telegram sheet to activate your subscription."
            />
          )}
          {(phase === "error" || phase === "timeout") && (
            <>
              <InlineAlert
                variant="error"
                title={phase === "timeout" ? "Payment timed out" : "Payment failed"}
                message={
                  phase === "timeout"
                    ? "Payment did not complete in time. You can try again."
                    : errorMessage || "We could not complete the payment. Please try again or contact support."
                }
              />
              <ActionRow fullWidth>
                <Button variant="secondary" size="sm" onClick={handleRetry}>
                  TRY AGAIN
                </Button>
              </ActionRow>
            </>
          )}
        </Panel>
      </PageSection>
    </PageFrame>
  );
}
