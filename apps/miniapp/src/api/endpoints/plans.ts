import { webappApi } from "../client";
import { withPreferredPaymentProvider } from "@/lib/payments/provider";

export type PlanStyle = "normal" | "popular" | "promotional";

export interface PlanItem {
  id: string;
  name?: string;
  duration_days: number;
  device_limit?: number;
  price_amount: number;
  price_currency: string;
  original_price_amount?: number | null;
  discount_percent?: number | null;
  style?: PlanStyle | null;
  upsell_methods?: string[];
  /** From API; used for ordering to match admin display_order */
  display_order?: number;
}

export interface PlansResponse {
  items: PlanItem[];
}

export function getPlans(): Promise<PlansResponse> {
  return webappApi.get<PlansResponse>(withPreferredPaymentProvider("/webapp/plans"));
}
