import { useEffect, useRef, useState } from "react";
import type { KeyboardEventHandler } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useBootstrapContext } from "@/bootstrap/BootstrapController";
import { PlanBillingHistorySection, PlanHeroCard, PlanNextStepCard, PlanOptionsSection, SessionMissing } from "@/components";
import { PageFrame } from "@/design-system/layouts/PageFrame";
import { FallbackScreen } from "@/design-system/patterns/FallbackScreen";
import {
  PageSection,
  PageCardSection,
  PageHeaderBadge,
  Skeleton,
  StarsAmount,
  ToggleRow,
  MissionSecondaryLink,
  useToast,
} from "@/design-system";
import { useUpdateSubscription } from "@/hooks";
import { usePlanPageModel, type BillingPeriod } from "@/page-models";
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
    title: item.title,
    subtitle: item.subtitle,
    amount: item.amount,
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
          <PlanHeroCard
            planName={heroView.heroPlanName}
            planPeriod={heroView.heroPlanPeriod}
            price={<StarsAmount value={heroView.heroStars} />}
            expiryText={heroView.expiryText}
            devicesLabel={heroView.devicesLabel}
            expiryPercent={barsReady ? heroView.expiryPercent : 0}
            expiryFillClass={heroView.expiryFillClass}
            renewLabel={heroView.renewLabel}
            manageLabel={heroView.manageLabel}
            onRenew={handleHeroRenew}
          />

          {nextStepCard ? (
            <PlanNextStepCard
              title={nextStepCard.title}
              badgeTone={nextStepCard.badgeTone}
              badgeLabel={nextStepCard.badgeLabel}
              alertTone={nextStepCard.alertTone}
              alertTitle={nextStepCard.alertTitle}
              alertMessage={nextStepCard.alertMessage}
              primaryLabel={nextStepCard.primaryLabel}
              primaryTo={nextStepCard.primaryTo}
              primaryUsesScrollAction={nextStepCard.primaryActionType === "scrollToPlans"}
              secondaryLabel={nextStepCard.secondaryLabel}
              secondaryTo={nextStepCard.secondaryTo}
              onPrimaryScrollAction={scrollToPlans}
            />
          ) : null}
        </>
      ) : null}

      {shouldShowPlanOptions ? (
        <PlanOptionsSection
          isSubscribed={isSubscribed}
          billingPeriod={billingPeriod}
          hasAnnualOptions={hasAnnualOptions}
          visibleTierPairs={visibleTierPairs}
          primaryPlanId={primarySub?.plan_id}
          subscriptionState={subscriptionState}
          showRenewOrUpgradeCta={showRenewOrUpgradeCta}
          selectedTierKey={selectedTierKey}
          carouselRef={carouselRef}
          onCarouselKeyDown={onCarouselKeyDown}
          onBillingPeriodChange={setBillingPeriod}
          onTierFocus={setSelectedTierKey}
          onTierSelect={({ tierKey, planId, currentForPeriod, isCurrentAndNeedsRenewal, showRenewCta }) => {
            setSelectedTierKey(tierKey);
            if (!planId) return;
            if (currentForPeriod && !showRenewCta) return;
            if (currentForPeriod && isCurrentAndNeedsRenewal && !showRenewOrUpgradeCta) return;
            track("cta_click", {
              cta_name: isCurrentAndNeedsRenewal ? "renew_plan" : "select_plan",
              screen_name: "plan",
              plan_id: planId,
            });
            track("plan_selected", { plan_id: planId });
            navigate(`/plan/checkout/${planId}`);
          }}
        />
      ) : null}

      {isSubscribed && (
        <PageCardSection
          title={t("plan.renewal_section_title")}
          description={autoRenewDescription}
          action={<PageHeaderBadge tone="info" label={t("plan.renewal_strip_title")} />}
          sectionClassName="plan-billing-page__secondary-section stagger-3"
          cardClassName="module-card plan-renew-strip"
        >
            <ToggleRow
              name={t("plan.renewal_strip_title")}
              description={undefined}
              checked={autoRenew}
              onChange={handleAutoRenewChange}
            />
        </PageCardSection>
      )}

      {isSubscribed && (
        <PlanBillingHistorySection
          items={billingHistoryView}
          loading={historyLoading}
          error={Boolean(historyError)}
          expanded={historyExpanded}
          canExpand={canExpandHistory}
          onToggleExpanded={() => setHistoryExpanded((value) => !value)}
        />
      )}
    </PageFrame>
  );
}
