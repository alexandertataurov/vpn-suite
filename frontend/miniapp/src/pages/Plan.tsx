import { useEffect, useRef, useState } from "react";
import type { KeyboardEventHandler } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useBootstrapContext } from "@/bootstrap/BootstrapController";
import {
  PlanHero,
  TierCard,
  BillingHistoryCard,
  SessionMissing,
} from "@/components";
import { FallbackScreen } from "@/design-system/patterns/FallbackScreen";
import {
  PageFrame,
  PageSection,
  PageCardSection,
  LabeledControlRow,
  Skeleton,
  SnapCarousel,
  SegmentedControl,
  ToggleRow,
  MissionAlert,
  MissionChip,
  MissionPrimaryButton,
  MissionPrimaryLink,
  MissionSecondaryLink,
  ButtonRow,
  useToast,
  EmptyStateBlock,
} from "@/design-system";
import { LimitStrip } from "@/components";
import { useUpdateSubscription } from "@/hooks";
import { usePlanPageModel, tierFeatureToRow, type BillingPeriod } from "@/page-models";
import { useI18n } from "@/hooks/useI18n";

const BAR_ANIMATION_DELAY_MS = 380;

function isE2EMode(): boolean {
  return (
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-e2e") === "true"
  );
}

function shouldReduceMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function historyIcon(status: "paid" | "pend" | "crit") {
  if (status === "paid") {
    return (
      <svg fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="2.2" y="3.2" width="11.6" height="9.6" rx="2.2" />
        <path d="M2.2 6h11.6" />
      </svg>
    );
  }
  if (status === "crit") {
    return (
      <svg fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="8" cy="8" r="5.8" />
        <path d="M8 5.3v3.2M8 10.7h.01" />
      </svg>
    );
  }
  return (
    <svg fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="8" cy="8" r="5.8" />
      <path d="M8 4.8v3.4M8 10.8h.01" />
    </svg>
  );
}

export function PlanPage() {
  const model = usePlanPageModel();
  const location = useLocation();
  const navigate = useNavigate();
  const { phase } = useBootstrapContext();
  const fromOnboarding = (location.state as { fromOnboarding?: boolean } | null)?.fromOnboarding === true;
  const { addToast } = useToast();
  const { t } = useI18n();
  const {
    primarySub,
    isSubscribed,
    subscriptionState,
    canShowRenew,
    showUpsellExpiry,
    showUpsellTrialEnd,
    renewalTargetTo,
    upgradeTargetTo,
    routeReason,
    track,
    tierPairs,
    visibleTierPairs,
    hasAnnualOptions,
    shouldShowPlanOptions,
    billingHistoryItems,
    historyLoading,
    historyError,
    nextStepCard,
    heroView,
    formatStars: formatStarsFn,
  } = model;
  const showRenewOrUpgradeCta = (canShowRenew && showUpsellExpiry) || showUpsellTrialEnd;

  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("annual");
  const [selectedTierKey, setSelectedTierKey] = useState<string>("");
  const [barsReady, setBarsReady] = useState<boolean>(() => isE2EMode());
  const [historyExpanded, setHistoryExpanded] = useState<boolean>(false);
  const [autoRenew, setAutoRenew] = useState<boolean>(primarySub?.auto_renew ?? true);
  const carouselRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      if (!isSubscribed) return;
      setAutoRenew(primarySub?.auto_renew ?? true);
    }, [primarySub?.auto_renew, primarySub?.id, isSubscribed]);

    const { mutate: updateAutoRenew } = useUpdateSubscription({
      primarySubId: primarySub?.id ?? null,
      onError: (message) => {
        setAutoRenew(primarySub?.auto_renew ?? true);
        addToast(message, "error");
      },
    });

    const handleAutoRenewChange = (next: boolean) => {
      setAutoRenew(next);
      updateAutoRenew(next);
    };

  useEffect(() => {
      if (!hasAnnualOptions && billingPeriod === "annual") {
        setBillingPeriod("monthly");
      }
    }, [billingPeriod, hasAnnualOptions]);

    useEffect(() => {
      if (tierPairs.length === 0) {
        setSelectedTierKey("");
        return;
      }
      if (selectedTierKey && tierPairs.some((tier) => tier.key === selectedTierKey)) return;
      const firstTier = tierPairs[0];
      if (!firstTier) return;
              const currentTier = tierPairs.find((tier) => tier.isCurrent);
      setSelectedTierKey(currentTier?.key ?? firstTier.key);
    }, [selectedTierKey, tierPairs]);

  useEffect(() => {
    if (isE2EMode()) {
      setBarsReady(true);
      return undefined;
    }
    setBarsReady(false);
    const timer = window.setTimeout(() => setBarsReady(true), BAR_ANIMATION_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [heroView.expiryPercent]);

  const visibleHistoryItems = historyExpanded ? billingHistoryItems : billingHistoryItems.slice(0, 3);
  const canExpandHistory = billingHistoryItems.length > 3;
  const billingHistoryView = visibleHistoryItems.map((item) => ({
    id: item.id,
    icon: historyIcon(item.statusClass),
    iconTone: (item.statusClass === "crit" ? "r" : item.statusClass === "paid" ? "g" : "a") as "r" | "g" | "a",
    title: item.title,
    subtitle: item.subtitle,
    amount: item.amount,
    statusLabel: item.statusLabel,
    statusVariant: item.statusVariant,
  }));

    if (model.pageState.status === "empty") {
      return <SessionMissing />;
    }

    if (model.pageState.status === "error") {
      return (
        <FallbackScreen
          title={model.pageState.title ?? t("common.could_not_load_title")}
          message={model.pageState.message ?? t("common.could_not_load_plan")}
          onRetry={model.pageState.onRetry}
        />
      );
    }

    if (model.pageState.status === "loading") {
      return (
        <PageFrame
          title={model.header.title}
          className="plan-billing-page plan-billing-page--loading"
        >
          <section>
            <Skeleton variant="card" />
          </section>
          <section>
            <Skeleton variant="card" />
          </section>
          <section>
            <Skeleton variant="card" />
          </section>
        </PageFrame>
      );
    }

    const scrollToPlans = () => {
      const el = typeof document !== "undefined" ? document.getElementById("availablePlans") : null;
      if (!el) return;
      el.scrollIntoView({ behavior: shouldReduceMotion() ? "auto" : "smooth", block: "start" });
    };

    const handleHeroRenew = () => {
      if ((subscriptionState === "expiring" || subscriptionState === "expired") && showRenewOrUpgradeCta) {
        const targetTo = showUpsellTrialEnd ? upgradeTargetTo : renewalTargetTo;
        const targetPlanId = targetTo.startsWith("/plan/checkout/") ? targetTo.replace("/plan/checkout/", "") : null;
        if (targetPlanId) {
          track("cta_click", {
            cta_name: showUpsellTrialEnd ? "upgrade_plan" : "renew_plan",
            screen_name: "plan",
            plan_id: targetPlanId,
          });
          track("plan_selected", { plan_id: targetPlanId });
          navigate(targetTo);
        } else {
          navigate("/plan");
        }
      } else if (subscriptionState === "active" && canShowRenew) {
        track("cta_click", { cta_name: "renew_plan", screen_name: "plan", plan_id: primarySub?.plan_id ?? undefined });
        navigate(renewalTargetTo);
      } else {
        scrollToPlans();
      }
    };

    const onCarouselKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const container = carouselRef.current;
      if (!container) return;
      const cards = Array.from(container.querySelectorAll<HTMLElement>(".tier-card"));
      if (cards.length === 0) return;

      event.preventDefault();
      const center = container.scrollLeft + container.clientWidth / 2;
      const indexed = cards.map((card, idx) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        return { idx, card, delta: Math.abs(cardCenter - center) };
      });
      indexed.sort((a, b) => a.delta - b.delta);
      const currentIndex = indexed[0]?.idx ?? 0;
      const dir = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = Math.max(0, Math.min(cards.length - 1, currentIndex + dir));
      const target = cards[nextIndex];
      if (!target) return;
      const targetLeft = target.offsetLeft + target.offsetWidth / 2 - container.clientWidth / 2;
      container.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: shouldReduceMotion() ? "auto" : "smooth",
      });
    };

    const handleHeroSecondary = () => {
      if (!isSubscribed) return;
      if (routeReason === "no_device") {
        navigate("/devices/issue");
        return;
      }
      navigate("/devices");
    };

  const autoRenewDescription =
    isSubscribed && autoRenew && primarySub?.valid_until
      ? t("plan.renewal_description_with_date", {
          date: new Date(primarySub.valid_until).toLocaleDateString(undefined, {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
        })
      : t("plan.renewal_description_generic");

  return (
    <PageFrame
      title={model.header.title}
      subtitle={model.header.subtitle}
      className="plan-billing-page"
    >
      {fromOnboarding && phase === "onboarding" && (
        <PageSection className="onboarding-return-banner">
          <MissionSecondaryLink to="/onboarding" state={{ fromOnboarding: true }}>
            {t("plan.onboarding_back_to_setup")}
          </MissionSecondaryLink>
        </PageSection>
      )}
      {isSubscribed ? (
        <>
          <section>
            <PlanHero
              planName={`${heroView.heroPlanName} — ${heroView.heroPlanPeriod}`}
              priceMain={formatStarsFn(heroView.heroStars)}
              period={heroView.heroPeriodDetail}
              validUntil={heroView.expiryText}
              expiryPercent={barsReady ? Math.round(heroView.expiryPercent) : 0}
              expiryFillClass={heroView.expiryFillClass}
              devicesLabel={heroView.devicesLabel}
              onRenew={handleHeroRenew}
              renewLabel={heroView.renewLabel}
              onManage={handleHeroSecondary}
              manageLabel={heroView.manageLabel}
              status={subscriptionState}
              className="stagger-1"
            />
          </section>

          {nextStepCard ? (
            <PageCardSection
              title={nextStepCard.title}
              action={<MissionChip tone={nextStepCard.badgeTone} className="section-meta-chip">{nextStepCard.badgeLabel}</MissionChip>}
              sectionClassName="plan-billing-page__next-step-section stagger-2"
              cardClassName="module-card plan-billing-page__next-step-card"
              >
              <MissionAlert
                tone={nextStepCard.alertTone}
                title={nextStepCard.alertTitle}
                message={nextStepCard.alertMessage}
              />
              <ButtonRow>
                {nextStepCard.primaryTo ? (
                  <MissionPrimaryLink to={nextStepCard.primaryTo}>{nextStepCard.primaryLabel}</MissionPrimaryLink>
                ) : (
                  <MissionPrimaryButton onClick={nextStepCard.primaryActionType === "scrollToPlans" ? scrollToPlans : undefined}>
                    {nextStepCard.primaryLabel}
                  </MissionPrimaryButton>
                )}
                {nextStepCard.secondaryLabel && nextStepCard.secondaryTo ? (
                  <MissionSecondaryLink to={nextStepCard.secondaryTo} className="plan-billing-page__secondary-link">
                    {nextStepCard.secondaryLabel}
                  </MissionSecondaryLink>
                ) : null}
              </ButtonRow>
            </PageCardSection>
          ) : null}
        </>
      ) : null}

      {shouldShowPlanOptions ? (
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
            onSelect={(id) => setBillingPeriod(id as BillingPeriod)}
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
            title={
              isSubscribed
                ? t("plan.no_plans_title_subscribed")
                : t("plan.no_plans_title_new")
            }
            message={
              isSubscribed
                ? t("plan.no_plans_message_subscribed")
                : t("plan.no_plans_message_new")
            }
          />
        ) : (
        <SnapCarousel
          ref={carouselRef}
          className={`snap-carousel--cards plan-billing-page__carousel ${visibleTierPairs.length <= 1 ? "plan-billing-page__carousel--single" : ""}`.trim()}
          id="availablePlans"
          role="region"
          aria-label="Plans carousel"
          tabIndex={0}
          onKeyDown={onCarouselKeyDown}
        >
          {visibleTierPairs.map((tier, index) => {
              const displayed = billingPeriod === "annual"
                ? (tier.annual ?? tier.monthly)
                : (tier.monthly ?? tier.annual);
              const selected = tier.key === selectedTierKey;
              const currentForPeriod = !!displayed && displayed.id === primarySub?.plan_id;
              const isCurrentAndNeedsRenewal =
                currentForPeriod &&
                (subscriptionState === "expiring" || subscriptionState === "expired");
              const showRenewCta = isCurrentAndNeedsRenewal && showRenewOrUpgradeCta;
              const stars = displayed?.price_amount ?? 0;
              const periodLabel = displayed
                ? t("plan.hero_period_for_days", { days: displayed.duration_days })
                : "";
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
                <TierCard
                  key={tier.key}
                  className={[
                    "plan-tier-card",
                    index === 0 ? "stagger-3" : index === 1 ? "stagger-4" : "stagger-5",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  data-tier={tier.key}
                  badge={tier.isCurrent ? t("plan.current_plan_label") : undefined}
                  name={tier.label}
                  description={tier.description}
                  priceMain={formatStarsFn(stars)}
                  period={periodLabel}
                  features={tier.features.map((f) => {
                    const row = tierFeatureToRow(f);
                    return {
                      ...row,
                      text: t(row.text as string),
                      value: row.value != null ? t(row.value as string) : undefined,
                    };
                  })}
                  selectLabel={selectLabel}
                  selected={selected}
                  featured={tier.isCurrent}
                  onClick={() => setSelectedTierKey(tier.key)}
                  onSelect={() => {
                    setSelectedTierKey(tier.key);
                    if (!displayed) return;
                    if (currentForPeriod && !showRenewCta) return;
                    if (currentForPeriod && isCurrentAndNeedsRenewal && !showRenewOrUpgradeCta) return;
                    track("cta_click", {
                      cta_name: isCurrentAndNeedsRenewal ? "renew_plan" : "select_plan",
                      screen_name: "plan",
                      plan_id: displayed.id,
                    });
                    track("plan_selected", { plan_id: displayed.id });
                    navigate(`/plan/checkout/${displayed.id}`);
                  }}
                  selectDisabled={!displayed || (currentForPeriod && !showRenewCta)}
                  selectAriaLabel={`${selectLabel}, ${tier.label}`}
                />
              );
            })}
        </SnapCarousel>
        )}
      </PageSection>
      ) : null}

      {isSubscribed && (
        <PageSection title={t("plan.renewal_section_title")} className="plan-billing-page__secondary-section stagger-3">
          <LimitStrip
            variant="compact"
            title={t("plan.renewal_strip_title")}
            message={autoRenewDescription}
            action={
              <ToggleRow
                name={t("plan.renewal_strip_title")}
                description={undefined}
                checked={autoRenew}
                onChange={handleAutoRenewChange}
              />
            }
            className="plan-renew-strip"
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                <path
                  d="M3 8a5 5 0 1 1 1.5 3.6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 5v3h3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />
        </PageSection>
      )}

        {isSubscribed && (
        <PageSection title={t("plan.payment_history_title")} className="plan-billing-page__secondary-section stagger-6">
          <BillingHistoryCard
            loading={historyLoading}
            errorMessage={historyError ? t("plan.payment_history_error") : null}
            items={billingHistoryView}
            footerLabel={
              historyExpanded
                ? t("plan.payment_history_show_recent")
                : t("plan.payment_history_view_all")
            }
            footerDisabled={!canExpandHistory}
            onFooterClick={() => {
              setHistoryExpanded((value) => !value);
            }}
          />
        </PageSection>
        )}
    </PageFrame>
  );
}
