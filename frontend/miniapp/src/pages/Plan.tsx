import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SessionMissing } from "@/components";
import {
  Button,
  CardRow,
  FallbackScreen,
  FooterHelp,
  RowItem,
  PageHeader,
  PageLayout,
  PageScaffold,
  PageSection,
  PlanBillingHistorySection,
  PlanCard,
  PlanNextStepCard,
  PlanOptionsSection,
  SectionLabel,
  Skeleton,
  Stack,
  VpnBoundaryNote,
} from "@/design-system";
import { IconClock, IconCreditCard, IconSmartphone } from "@/design-system/icons";

import { useI18n } from "@/hooks";
import { usePlanPageModel, type BillingPeriod } from "@/page-models";

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
  const fromOnboarding = (location.state as { fromOnboarding?: boolean } | null)?.fromOnboarding === true;

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
    activeDeviceCount,
    deviceLimit,
  } = model;
  const showRenewOrUpgradeCta = (canShowRenew && showUpsellExpiry) || showUpsellTrialEnd;

  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("annual");
  const [selectedTierKey, setSelectedTierKey] = useState<string>("");
  const [historyExpanded, setHistoryExpanded] = useState<boolean>(false);

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
    const currentTier = tierPairs.find((tier) => tier.isCurrent);
    setSelectedTierKey(currentTier?.key ?? tierPairs[0]?.key ?? "");
  }, [selectedTierKey, tierPairs]);

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
      <PageScaffold>
        <PageLayout scrollable={false}>
          <PageHeader
            title={model.header.title}
            subtitle={model.header.subtitle}
            onBack={() => navigate(fromOnboarding ? "/onboarding" : "/")}
            backAriaLabel={t("common.back_aria")}
          />
          <Stack gap="2">
            <Skeleton variant="card" height={220} />
            <Skeleton variant="line" width="40%" />
            <Skeleton variant="card" height={360} />
          </Stack>
        </PageLayout>
      </PageScaffold>
    );
  }

  const scrollToPlans = () => {
    const el = typeof document !== "undefined" ? document.getElementById("availablePlans") : null;
    if (!el) return;
    el.scrollIntoView({ behavior: shouldReduceMotion() ? "auto" : "smooth", block: "start" });
  };

  const handleRenewAction = () => {
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
        return;
      }
      navigate("/plan");
      return;
    }

    if (subscriptionState === "active" && canShowRenew) {
      track("cta_click", { cta_name: "renew_plan", screen_name: "plan", plan_id: primarySub?.plan_id ?? undefined });
      navigate(renewalTargetTo);
      return;
    }

    scrollToPlans();
  };

  return (
    <PageScaffold className="plan-billing-page">
      <PageLayout scrollable={false}>
      <PageHeader
        title={model.header.title}
        subtitle={model.header.subtitle}
        onBack={() => navigate(fromOnboarding ? "/onboarding" : "/")}
        backAriaLabel={t("common.back_aria")}
      />

      {isSubscribed ? (
        <Stack gap="2">
          <PlanCard
            plan={heroView.heroPlanName}
            planSub={heroView.heroPlanPeriod}
            eyebrow={t("plan.current_plan_label")}
            status={subscriptionState}
            devices={activeDeviceCount}
            deviceLimit={deviceLimit}
            renewsLabel={heroView.expiryText}
          />
          <Stack gap="2">
            <SectionLabel label={t("plan.current_plan_label")} />
            <CardRow className="plan-current-summary">
              <RowItem
                icon={<IconCreditCard size={15} strokeWidth={2} aria-hidden />}
                iconVariant="neutral"
                label={t("plan.hero_price_label")}
                subtitle={model.formatStars(heroView.heroStars)}
                showChevron={false}
              />
              <RowItem
                icon={<IconSmartphone size={15} strokeWidth={2} aria-hidden />}
                iconVariant="neutral"
                label={t("plan.hero_devices_label")}
                subtitle={heroView.devicesLabel}
                showChevron={false}
              />
              <RowItem
                icon={<IconClock size={15} strokeWidth={2} aria-hidden />}
                iconVariant="neutral"
                label={t("plan.hero_valid_until_label")}
                subtitle={heroView.expiryText}
                showChevron={false}
              />
            </CardRow>
          </Stack>
          <Stack gap="3">
            <Button variant="primary" fullWidth onClick={() => navigate("/devices")}>
              {heroView.manageLabel}
            </Button>
            {canShowRenew && (
              <Button variant="secondary" fullWidth onClick={handleRenewAction}>
                {t("plan.cta_renew_plan")}
              </Button>
            )}
          </Stack>
        </Stack>
      ) : (
        <PageSection
          title={t("plan.no_subscription_note_title")}
        >
          <VpnBoundaryNote tone="info" messageKey="plan.no_subscription_note_body" />
        </PageSection>
      )}

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

      {isSubscribed ? (
        <PlanBillingHistorySection
          items={billingHistoryView}
          loading={historyLoading}
          error={Boolean(historyError)}
          expanded={historyExpanded}
          canExpand={canExpandHistory}
          onToggleExpanded={() => setHistoryExpanded((value) => !value)}
        />
      ) : null}

      {nextStepCard ? (
        <PlanNextStepCard
          title={nextStepCard.title}
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

      <FooterHelp
        note={t("footer.having_trouble")}
        linkLabel={t("footer.view_setup_guide")}
        onLinkClick={() => navigate("/support")}
      />
      </PageLayout>
    </PageScaffold>
  );
}
