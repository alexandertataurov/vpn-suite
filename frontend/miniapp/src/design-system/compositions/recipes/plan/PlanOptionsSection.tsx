import { BillingPeriodToggle, Button, EmptyStateBlock, PageSection, StarsAmount, StatusChip } from "@/design-system";
import { useI18n } from "@/hooks";
import { tierFeatureToRow, type BillingPeriod } from "@/page-models";
import type { TierFeature } from "@/page-models/plan-helpers";

interface TierPriceOption {
  id: string;
  duration_days: number;
  price_amount: number;
}

interface TierPair {
  key: string;
  label: string;
  description?: string | null;
  isCurrent: boolean;
  monthly?: TierPriceOption | null;
  annual?: TierPriceOption | null;
  features: TierFeature[];
}

export interface PlanOptionsSectionProps {
  isSubscribed: boolean;
  billingPeriod: BillingPeriod;
  hasAnnualOptions: boolean;
  visibleTierPairs: TierPair[];
  primaryPlanId?: string | null;
  subscriptionState: "active" | "expiring" | "expired" | string;
  showRenewOrUpgradeCta: boolean;
  selectedTierKey: string;
  onBillingPeriodChange: (period: BillingPeriod) => void;
  onTierFocus: (key: string) => void;
  onTierSelect: (args: {
    tierKey: string;
    planId: string | null;
    currentForPeriod: boolean;
    isCurrentAndNeedsRenewal: boolean;
    showRenewCta: boolean;
  }) => void;
}

export function PlanOptionsSection({
  isSubscribed,
  billingPeriod,
  hasAnnualOptions,
  visibleTierPairs,
  primaryPlanId,
  subscriptionState,
  showRenewOrUpgradeCta,
  selectedTierKey,
  onBillingPeriodChange,
  onTierFocus,
  onTierSelect,
}: PlanOptionsSectionProps) {
  const { t } = useI18n();

  return (
    <PageSection
      title={
        isSubscribed
          ? t("plan.section_available_plans_title_subscribed")
          : t("plan.section_available_plans_title_new")
      }
      description={t("plan.section_available_plans_description")}
      className="plan-billing-page__plans-section"
    >
      <div className="plan-billing-page__billing-period">
        <span className="plan-billing-page__billing-period-label">{t("plan.billing_period_label")}</span>
        <div className="plan-billing-page__period-toggle">
          <BillingPeriodToggle
            value={billingPeriod}
            onChange={onBillingPeriodChange}
            monthlyLabel={t("plan.billing_monthly_compact")}
            annualLabel={t("plan.billing_annual_compact")}
            discount={hasAnnualOptions ? t("plan.billing_annual_tag") : undefined}
            annualDisabled={!hasAnnualOptions}
            saveLabel={t("common.save")}
          />
        </div>
      </div>

      {visibleTierPairs.length === 0 ? (
        <EmptyStateBlock
          title={isSubscribed ? t("plan.no_plans_title_subscribed") : t("plan.no_plans_title_new")}
          message={isSubscribed ? t("plan.no_plans_message_subscribed") : t("plan.no_plans_message_new")}
        />
      ) : (
        <div id="availablePlans" className="modern-plan-grid">
          {visibleTierPairs.map((tier) => {
            const displayed = billingPeriod === "annual" ? (tier.annual ?? tier.monthly) : (tier.monthly ?? tier.annual);
            const currentForPeriod = !!displayed && displayed.id === primaryPlanId;
            const isCurrentAndNeedsRenewal = currentForPeriod && (subscriptionState === "expiring" || subscriptionState === "expired");
            const showRenewCta = isCurrentAndNeedsRenewal && showRenewOrUpgradeCta;
            const selectLabel = currentForPeriod
              ? showRenewCta
                ? t("plan.cta_renew_plan")
                : t("plan.current_plan_label")
              : isSubscribed
                ? t("plan.cta_switch_plan")
                : t("plan.cta_choose_plan");

            return (
              <article
                key={tier.key}
                className={[
                  "modern-plan-card",
                  selectedTierKey === tier.key ? "modern-plan-card--selected" : "",
                  currentForPeriod ? "modern-plan-card--current" : "",
                ].filter(Boolean).join(" ")}
                onClick={() => onTierFocus(tier.key)}
              >
                <div className="modern-plan-header">
                  <div className="modern-plan-title-group">
                    <h3 className="modern-plan-title">
                      {tier.label}
                      {currentForPeriod ? <StatusChip variant="active">{t("plan.current_plan_label")}</StatusChip> : null}
                    </h3>
                    {tier.description ? <p className="modern-status-subtitle">{tier.description}</p> : null}
                  </div>
                  {displayed ? (
                    <div className="modern-plan-price">
                      <StarsAmount value={displayed.price_amount} />
                    </div>
                  ) : null}
                </div>

                <ul className="modern-plan-features">
                  {tier.features.map((feature) => {
                    const row = tierFeatureToRow(feature);
                    const text = t(row.text as string);
                    const value = row.value != null ? t(row.value as string) : undefined;
                    return (
                      <li key={`${tier.key}-${String(row.text)}`} className="modern-plan-feature">
                        <span className="modern-plan-feature-label">{text}</span>
                        {value ? <span className="modern-plan-feature-value">{value}</span> : null}
                      </li>
                    );
                  })}
                </ul>

                <Button
                  variant={currentForPeriod && !showRenewCta ? "secondary" : "primary"}
                  fullWidth
                  size="lg"
                  disabled={!displayed || (currentForPeriod && !showRenewCta)}
                  onClick={(event) => {
                    event.stopPropagation();
                    onTierSelect({
                      tierKey: tier.key,
                      planId: displayed?.id ?? null,
                      currentForPeriod,
                      isCurrentAndNeedsRenewal,
                      showRenewCta,
                    });
                  }}
                  aria-label={`${selectLabel}, ${tier.label}`}
                >
                  {selectLabel}
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </PageSection>
  );
}
