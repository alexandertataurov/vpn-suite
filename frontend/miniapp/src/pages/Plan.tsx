import { useEffect, useRef, useState } from "react";
import type { KeyboardEventHandler } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  PlanHero,
  TierCard,
  UsageSummaryCard,
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
  MissionPrimaryButton,
  MissionPrimaryLink,
  MissionSecondaryLink,
  ButtonRow,
  useToast,
  EmptyStateBlock,
} from "@/design-system";
import { useUpdateSubscription } from "@/hooks";
import { formatBytes } from "@/lib/utils/format";
import { percentClass } from "@/lib/percentClass";
import { clamp } from "@/page-models/plan-helpers";
import { usePlanPageModel, tierFeatureToRow, type BillingPeriod } from "@/page-models";

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

interface UsageProgressFillProps {
  className: string;
  percent: number;
}

function UsageProgressFill({ className, percent }: UsageProgressFillProps) {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fillRef.current?.style.setProperty("--pct", String(clamp(percent, 0, 100)));
  }, [percent]);

  return <div ref={fillRef} className={className} />;
}

export function PlanPage() {
  const model = usePlanPageModel();
  const location = useLocation();
  const navigate = useNavigate();
  const fromOnboarding = (location.state as { fromOnboarding?: boolean } | null)?.fromOnboarding === true;
  const { addToast } = useToast();
  const {
    activeSub,
    primarySub,
    isSubscribed,
    subscriptionState,
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
    usageSummary,
    billingHistoryItems,
    historyLoading,
    historyError,
    nextStepCard,
    heroView,
    formatStars: formatStarsFn,
  } = model;
  const showRenewOrUpgradeCta = showUpsellExpiry || showUpsellTrialEnd;

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

  const {
    activeDeviceCount,
    deviceLimit,
    devicePercent,
    dataPercent,
    deviceTone,
    totalTrafficBytes,
  } = usageSummary;

  const animatedDevicePercentClass = percentClass(barsReady ? Math.round(devicePercent) : 0);
  const animatedDataPercentClass = percentClass(barsReady ? Math.round(dataPercent) : 0);

  useEffect(() => {
    if (isE2EMode()) {
      setBarsReady(true);
      return undefined;
    }
    setBarsReady(false);
    const timer = window.setTimeout(() => setBarsReady(true), BAR_ANIMATION_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [devicePercent, dataPercent]);

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
          title={model.pageState.title ?? "Could not load"}
          message={model.pageState.message ?? "We could not load your plan or options. Please try again or contact support."}
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
      } else if (subscriptionState === "expiring" || subscriptionState === "expired") {
        scrollToPlans();
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
        ? `Renews on ${new Date(primarySub.valid_until).toLocaleDateString(undefined, {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}. Charged via Telegram.`
        : "Renews automatically when your plan is active.";

  return (
    <PageFrame
      title={model.header.title}
      className="plan-billing-page"
    >
      {fromOnboarding && (
        <PageSection className="onboarding-return-banner">
          <MissionSecondaryLink to="/onboarding" state={{ fromOnboarding: true }}>
            ← Back to setup
          </MissionSecondaryLink>
        </PageSection>
      )}
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
          onManage={isSubscribed ? handleHeroSecondary : undefined}
          manageLabel={heroView.manageLabel}
          status={subscriptionState}
          className="stagger-1"
        />
      </section>

      {nextStepCard ? (
        <PageCardSection
          title={nextStepCard.title}
          description={nextStepCard.description}
          className="stagger-2"
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
              <MissionSecondaryLink to={nextStepCard.secondaryTo}>
                {nextStepCard.secondaryLabel}
              </MissionSecondaryLink>
            ) : null}
          </ButtonRow>
        </PageCardSection>
      ) : null}

        {isSubscribed && (
        <PageSection title="Renewal" className="stagger-3">
          <div className="limit-strip limit-strip--compact plan-renew-strip">
            <div className="limit-strip__icon" aria-hidden>
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
            </div>
            <div className="limit-strip__text">
              <div className="limit-strip__title">Auto-renew</div>
              <div className="limit-strip__message">{autoRenewDescription}</div>
            </div>
            <div className="limit-strip__action">
              <ToggleRow
                name="Auto-renew"
                description={undefined}
                checked={autoRenew}
                onChange={handleAutoRenewChange}
              />
            </div>
          </div>
        </PageSection>
      )}

      {shouldShowPlanOptions ? (
      <PageSection title="Available Plans" className="stagger-4">
        <LabeledControlRow label="Billing period">
          <SegmentedControl
            ariaLabel="Billing period"
            activeId={billingPeriod}
            onSelect={(id) => setBillingPeriod(id as BillingPeriod)}
            options={[
              { id: "monthly", label: "Monthly" },
              { id: "annual", label: "Annual", tag: "−20%", disabled: !hasAnnualOptions },
            ]}
          />
        </LabeledControlRow>

        {visibleTierPairs.length === 0 ? (
          <EmptyStateBlock
            title={isSubscribed ? "You're on the highest plan" : "No plans available"}
            message={isSubscribed
              ? "No higher-tier plans are available right now."
              : "Try again later or contact support."}
          />
        ) : (
        <SnapCarousel
          ref={carouselRef}
          className="snap-carousel--cards"
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
              const periodLabel = displayed ? `for ${displayed.duration_days} days` : "";
              const selectLabel = currentForPeriod
                ? isCurrentAndNeedsRenewal
                  ? showRenewOrUpgradeCta
                    ? "Renew plan"
                    : "Current Plan"
                  : "Current Plan"
                : isSubscribed
                  ? "Upgrade Plan"
                  : "Choose plan";

              return (
                <TierCard
                  key={tier.key}
                  className={[
                    index === 0 ? "stagger-3" : index === 1 ? "stagger-4" : "stagger-5",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  data-tier={tier.key}
                  badge={tier.isCurrent ? "Current plan" : undefined}
                  name={tier.label}
                  description={tier.description}
                  priceMain={formatStarsFn(stars)}
                  period={periodLabel}
                  features={tier.features.map(tierFeatureToRow)}
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

      {isSubscribed ? (
      <PageSection title="Usage this cycle" className="stagger-4 plan-billing-page__usage">
        <UsageSummaryCard
          items={[
            {
              id: "devices",
              label: "Devices used",
              value: deviceLimit > 0 ? `${activeDeviceCount} / ${deviceLimit} used` : `${activeDeviceCount} used`,
              tone: deviceTone,
              progress: (
                <UsageProgressFill
                  className={`usage-fill h-fill crit ${animatedDevicePercentClass}`.trim()}
                  percent={barsReady ? devicePercent : 0}
                />
              ),
            },
            {
              id: "traffic",
              label: "Data transferred this cycle",
              value: activeSub
                ? (
                  <>
                    {formatBytes(totalTrafficBytes, { digits: 1 })} used{" "}
                    <span className="status-chip info">Unlimited</span>
                  </>
                )
                : "--",
              tone: "ok",
              progress: (
                <UsageProgressFill
                  className={`usage-fill h-fill warn ${animatedDataPercentClass}`.trim()}
                  percent={barsReady ? dataPercent : 0}
                />
              ),
            },
          ]}
        />
      </PageSection>
      ) : (
        <PageSection title="Usage & Billing" className="stagger-4">
          <p className="page-placeholder-message type-body-sm">
            Usage and billing appear after you activate a plan.
          </p>
        </PageSection>
      )}

        {isSubscribed && (
        <PageSection title="Billing History" className="stagger-6">
          <BillingHistoryCard
            loading={historyLoading}
            errorMessage={historyError ? "Could not load billing history." : null}
            items={billingHistoryView}
            footerLabel={historyExpanded ? "Show recent" : "View all"}
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
