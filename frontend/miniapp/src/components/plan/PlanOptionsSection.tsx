import type { KeyboardEventHandler, RefObject } from "react";
import { ButtonRow, DataCell, DataGrid, EmptyStateBlock, LabeledControlRow, MissionCard, MissionModuleHead, MissionPrimaryButton, PageSection, SegmentedControl, SnapCarousel, StarsAmount, StatusChip } from "@/design-system";
import { useI18n } from "@/hooks/useI18n";
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
  carouselRef: RefObject<HTMLDivElement | null>;
  onCarouselKeyDown: KeyboardEventHandler<HTMLDivElement>;
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
  carouselRef,
  onCarouselKeyDown,
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
      className="plan-billing-page__plans-section stagger-4"
    >
      <LabeledControlRow
        label={t("plan.billing_period_label")}
        className="plan-billing-page__billing-period"
      >
        <SegmentedControl
          className="plan-billing-page__period-toggle"
          ariaLabel={t("plan.billing_period_label")}
          activeId={billingPeriod}
          onSelect={(id) => onBillingPeriodChange(id as BillingPeriod)}
          options={[
            { id: "monthly", label: t("plan.billing_monthly_compact") },
            {
              id: "annual",
              label: t("plan.billing_annual_compact"),
              tag: t("plan.billing_annual_tag"),
              disabled: !hasAnnualOptions,
            },
          ]}
        />
      </LabeledControlRow>

      {visibleTierPairs.length === 0 ? (
        <EmptyStateBlock
          title={isSubscribed ? t("plan.no_plans_title_subscribed") : t("plan.no_plans_title_new")}
          message={isSubscribed ? t("plan.no_plans_message_subscribed") : t("plan.no_plans_message_new")}
        />
      ) : (
        <SnapCarousel
          ref={carouselRef as RefObject<HTMLDivElement>}
          className={`snap-carousel--cards plan-billing-page__carousel ${visibleTierPairs.length <= 1 ? "plan-billing-page__carousel--single" : ""}`.trim()}
          id="availablePlans"
          role="region"
          aria-label="Plans carousel"
          tabIndex={0}
          onKeyDown={onCarouselKeyDown}
        >
          {visibleTierPairs.map((tier, index) => {
            const displayed = billingPeriod === "annual" ? (tier.annual ?? tier.monthly) : (tier.monthly ?? tier.annual);
            const currentForPeriod = !!displayed && displayed.id === primaryPlanId;
            const isCurrentAndNeedsRenewal = currentForPeriod && (subscriptionState === "expiring" || subscriptionState === "expired");
            const showRenewCta = isCurrentAndNeedsRenewal && showRenewOrUpgradeCta;
            const stars = displayed?.price_amount ?? 0;
            const periodLabel = displayed ? t("plan.hero_period_for_days", { days: displayed.duration_days }) : "";
            const selectLabel = currentForPeriod
              ? isCurrentAndNeedsRenewal
                ? showRenewOrUpgradeCta
                  ? t("plan.cta_renew_plan")
                  : t("plan.current_plan_label")
                : t("plan.current_plan_label")
              : isSubscribed
                ? t("plan.cta_upgrade_plan")
                : t("plan.cta_continue_to_checkout");

            return (
              <MissionCard
                key={tier.key}
                tone={tier.isCurrent ? "green" : "blue"}
                glowTone={tier.isCurrent ? "green" : null}
                className={[
                  "plan-tier-card",
                  selectedTierKey === tier.key ? "plan-tier-card--selected" : "",
                  index === 0 ? "stagger-3" : index === 1 ? "stagger-4" : "stagger-5",
                ].filter(Boolean).join(" ")}
                data-tier={tier.key}
                onClick={() => onTierFocus(tier.key)}
              >
                <MissionModuleHead
                  label={tier.label}
                  chip={tier.isCurrent ? <StatusChip variant="active">{t("plan.current_plan_label")}</StatusChip> : null}
                />
                {tier.description ? <p className="op-desc type-body-sm">{tier.description}</p> : null}
                {displayed ? (
                  <DataGrid columns={1} layout="1xcol">
                    <DataCell
                      label={t("plan.grid_price_label")}
                      value={<StarsAmount value={stars} />}
                      valueTone="teal"
                    />
                    <DataCell label={t("plan.grid_duration_label")} value={periodLabel} />
                  </DataGrid>
                ) : null}
                <ul className="plan-tier-features list-unstyled">
                  {tier.features.map((feature) => {
                    const row = tierFeatureToRow(feature);
                    const text = t(row.text as string);
                    const value = row.value != null ? t(row.value as string) : undefined;
                    return (
                      <li key={`${tier.key}-${String(row.text)}`} className="plan-tier-feature">
                        <div className="feat-row">
                          <span className="feat-text">{text}</span>
                          {value ? <span className="feat-val">{value}</span> : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <ButtonRow>
                  <MissionPrimaryButton
                    disabled={!displayed || (currentForPeriod && !showRenewCta)}
                    onClick={() =>
                      onTierSelect({
                        tierKey: tier.key,
                        planId: displayed?.id ?? null,
                        currentForPeriod,
                        isCurrentAndNeedsRenewal,
                        showRenewCta,
                      })
                    }
                    aria-label={`${selectLabel}, ${tier.label}`}
                  >
                    {selectLabel}
                  </MissionPrimaryButton>
                </ButtonRow>
              </MissionCard>
            );
          })}
        </SnapCarousel>
      )}
    </PageSection>
  );
}
