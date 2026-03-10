/**
 * Intent-based copy (UPSELL-ENGINE-SPEC §15).
 */

import type { UpgradeIntent, UpsellDecision, PlanLikeForUpsell } from "./upsell.types";

export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

const CTA_KEY_BY_TRIGGER: Record<UpgradeIntent, string> = {
  device_limit: "upsell.cta_upgrade",
  expiry: "upsell.cta_renew",
  trial_end: "upsell.cta_choose_paid",
  annual_savings: "upsell.cta_annual_savings",
  family: "upsell.cta_family",
  premium_regions: "upsell.cta_premium_regions",
  speed: "upsell.cta_speed",
  referral: "upsell.cta_referral",
  winback: "upsell.cta_winback",
  addon: "upsell.cta_addon",
};

export function getUpsellCopy(
  t: TranslateFn,
  decision: UpsellDecision,
  ctx?: { currentPlan?: PlanLikeForUpsell | null; plans?: PlanLikeForUpsell[] },
): { title: string; body: string; ctaLabel: string } {
  const { trigger, targetPlanId } = decision;
  const currentPlan = ctx?.currentPlan;
  const plans = ctx?.plans ?? [];
  const targetPlan = targetPlanId ? plans.find((p) => p.id === targetPlanId) : undefined;

  let title = "";
  let body = "";

  switch (trigger) {
    case "device_limit": {
      const currentLimit = currentPlan?.device_limit ?? 0;
      const targetLimit = targetPlan?.device_limit ?? currentLimit + 1;
      const delta = targetLimit - currentLimit;
      title = t("upsell.device_limit_title");
      body =
        delta > 1 ? t("upsell.device_limit_body_many", { delta }) : t("upsell.device_limit_body_one");
      break;
    }
    case "expiry":
      title = t("upsell.expiry_title");
      body = t("upsell.expiry_body");
      break;
    case "trial_end":
      title = t("upsell.trial_end_title");
      body = t("upsell.trial_end_body");
      break;
    case "referral":
      title = t("upsell.referral_title");
      body = t("upsell.referral_body");
      break;
    case "annual_savings":
      title = t("upsell.annual_savings_title");
      body = t("upsell.annual_savings_body");
      break;
    case "family":
      title = t("upsell.family_title");
      body = t("upsell.family_body");
      break;
    case "winback":
      title = t("upsell.winback_title");
      body = t("upsell.winback_body");
      break;
    default:
      title = t("upsell.default_title");
      body = t("upsell.default_body");
  }

  const ctaKey = CTA_KEY_BY_TRIGGER[trigger] ?? "upsell.cta_upgrade";
  const ctaLabel = t(ctaKey);

  return { title, body, ctaLabel };
}
