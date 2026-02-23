import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { WebAppCreateInvoiceResponse } from "@vpn-suite/shared/types";
import { Panel, Input, Button } from "@vpn-suite/shared/ui";
import { useMutation } from "@tanstack/react-query";
import { webappApi } from "../api/client";

export function CheckoutPage() {
  const { planId } = useParams<{ planId: string }>();
  const selectedPlanId = planId ?? "";
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoPreview, setPromoPreview] = useState<{ description: string } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>("");

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
    onSuccess: () => setPaymentStatus("waiting"),
    onError: () => setPaymentStatus("error"),
  });

  return (
    <div className="page-content">
      <div className="miniapp-page-header">
        <div>
          <h1 className="miniapp-page-title">Checkout</h1>
          <p className="miniapp-page-subtitle">Plan {planId ?? "N/A"}</p>
        </div>
      </div>
      <Link to="/plans" className="miniapp-back-link">Back to plans</Link>
      <Panel>
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
        {promoPreview && <p className="text-success">{promoPreview.description}</p>}
        {promoError && <p className="text-error">{promoError}</p>}
        <Button
          onClick={() => createInvoice.mutate()}
          loading={createInvoice.isPending}
          size="lg"
          className="mt-md"
          disabled={!planId}
        >
          Pay with Telegram Stars
        </Button>
        {paymentStatus === "waiting" && <p className="payment-status-waiting">Waiting for payment. Complete in Telegram.</p>}
        {paymentStatus === "error" && <p className="text-error">Failed to start payment. Please try again.</p>}
      </Panel>
    </div>
  );
}
