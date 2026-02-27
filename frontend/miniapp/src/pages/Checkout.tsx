import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { WebAppCreateInvoiceResponse } from "@vpn-suite/shared/types";
import { Panel, Input, Button, InlineAlert } from "@vpn-suite/shared/ui";
import { useMutation } from "@tanstack/react-query";
import { webappApi, getWebappToken } from "../api/client";
import { useTelegramMainButton } from "../hooks/useTelegramMainButton";
import { useTelegramBackButton } from "../hooks/useTelegramBackButton";
import { useTelegramHaptics } from "../hooks/useTelegramHaptics";
import { useTrackScreen } from "../hooks/useTrackScreen";
import { useTelemetry } from "../hooks/useTelemetry";

export function CheckoutPage() {
  const { planId } = useParams<{ planId: string }>();
  const selectedPlanId = planId ?? "";
  const hasToken = !!getWebappToken();
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoPreview, setPromoPreview] = useState<{ description: string } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const { impact, notify } = useTelegramHaptics();
  useTrackScreen("checkout", null);
  const { track } = useTelemetry(null);

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

  const createInvoice = useMutation({
    mutationFn: () => {
      if (!selectedPlanId) throw new Error("Plan is missing");
      return webappApi.post<WebAppCreateInvoiceResponse>("/webapp/payments/create-invoice", {
        plan_id: selectedPlanId,
        promo_code: promoCode.trim() || undefined,
      });
    },
    onSuccess: () => {
      setPaymentStatus("waiting");
      notify("success");
      track("payment_start", { plan_id: selectedPlanId });
    },
    onError: () => {
      setPaymentStatus("error");
      notify("error");
      track("payment_fail", { plan_id: selectedPlanId });
    },
  });

  useTelegramBackButton(true);

  const canPay = !!selectedPlanId && hasToken;
  const handlePay = () => {
    impact("medium");
    track("cta_click", { cta_name: "pay_with_telegram_stars", screen_name: "checkout", plan_id: selectedPlanId });
    createInvoice.mutate();
  };

  useTelegramMainButton(
    canPay
      ? {
          text: createInvoice.isPending ? "Starting payment…" : "Pay with Telegram Stars",
          visible: true,
          enabled: !createInvoice.isPending,
          loading: createInvoice.isPending,
          onClick: handlePay,
        }
      : null
  );

  return (
    <div className="page-content">
      <div className="miniapp-page-header">
        <div>
          <h1 className="miniapp-page-title">Checkout</h1>
          <p className="miniapp-page-subtitle">Plan {planId ?? "N/A"}</p>
        </div>
      </div>
      <Link to="/plan" className="miniapp-back-link">Back to plan</Link>
      <Panel>
        {!hasToken && (
          <InlineAlert
            variant="warning"
            title="Session missing"
            message="Your Telegram session is not active. Close and reopen the mini app from the bot before paying."
            className="mb-md"
          />
        )}
        <p>Plan ID: {planId}</p>
        <form onSubmit={(e) => { e.preventDefault(); validatePromo.mutate(); }} className="form-inline flex-col items-stretch">
          <Input placeholder="Promo code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            disabled={!selectedPlanId || !promoCode.trim() || validatePromo.isPending}
          >
            Apply
          </Button>
        </form>
        {promoPreview && (
          <InlineAlert
            variant="info"
            title="Promo applied"
            message={promoPreview.description}
            className="mt-sm"
          />
        )}
        {promoError && (
          <InlineAlert
            variant="error"
            title="Invalid promo code"
            message={promoError}
            className="mt-sm"
          />
        )}
        <Button
          onClick={handlePay}
          loading={createInvoice.isPending}
          size="lg"
          className="mt-md"
          disabled={!planId || !hasToken}
        >
          Pay with Telegram Stars
        </Button>
        {paymentStatus === "waiting" && (
          <InlineAlert
            variant="info"
            title="Waiting for payment"
            message="Confirm the Stars payment in the Telegram sheet to activate your subscription."
            className="payment-status-waiting"
          />
        )}
        {paymentStatus === "error" && (
          <InlineAlert
            variant="error"
            title="Payment not started"
            message="We could not start the Telegram Stars payment. Please try again."
          />
        )}
      </Panel>
    </div>
  );
}
