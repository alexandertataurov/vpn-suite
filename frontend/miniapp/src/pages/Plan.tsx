import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEventHandler } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import type {
  WebAppBillingHistoryItem,
  WebAppBillingHistoryStatus,
} from "@vpn-suite/shared";
import {
  FallbackScreen,
  SessionMissing,
  PageFrame,
  PageSection,
  PageCardSection,
  LabeledControlRow,
  Skeleton,
  PlanHero,
  SnapCarousel,
  TierCard,
  SegmentedControl,
  UsageSummaryCard,
  BillingHistoryCard,
  ToggleRow,
  MissionAlert,
  MissionChip,
  MissionPrimaryButton,
  MissionPrimaryLink,
  MissionSecondaryLink,
  useToast,
} from "@/design-system";
import { useUpdateSubscription } from "@/hooks";
import { formatBytes } from "@/lib/utils/format";
import { getPercentClass } from "@/lib/percentClass";
import { webappQueryKeys } from "@/lib/query-keys/webapp.query-keys";
import { usePlanPageModel, type BillingPeriod, type PlanItem } from "@/page-models";

type UsageTone = "ok" | "warn" | "crit";

interface TierFeature {
  id: string;
  icon: "yes" | "no" | "amber";
  text: string;
  value?: string;
}

function tierFeatureToRow(feature: TierFeature) {
  return {
    icon: feature.icon,
    text: feature.text,
    value: feature.value,
  } as const;
}

interface TierPair {
  key: string;
  label: string;
  description: string;
  monthly?: PlanItem;
  annual?: PlanItem;
  isCurrent: boolean;
  features: TierFeature[];
}

const YEARLY_DURATION_THRESHOLD = 45;
const LIFETIME_DURATION_THRESHOLD = 36500;
const DEFAULT_USAGE_SOFT_CAP_BYTES = 20 * 1024 * 1024 * 1024;
const BAR_ANIMATION_DELAY_MS = 380;
const COPY_FEEDBACK_MS = 1600;

function isE2EMode(): boolean {
  return (
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-e2e") === "true"
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeTierKey(rawName: string): string {
  const name = rawName.trim().toLowerCase();
  if (name.includes("basic") || name.includes("standard")) return "basic";
  if (name.includes("pro")) return "pro";
  if (name.includes("team") || name.includes("family")) return "team";
  const slug = name.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "plan";
}

function tierLabelForKey(key: string, fallbackName: string): string {
  if (key === "basic") return "Basic";
  if (key === "pro") return "Pro";
  if (key === "team") return "Team";
  return fallbackName || "Plan";
}

function tierDescriptionForKey(key: string): string {
  if (key === "basic") return "Personal use · 1 device";
  if (key === "pro") return "Power users · 3 devices";
  if (key === "team") return "Shared access · multi-device";
  return "Secure VPN access";
}

function tierSortRank(key: string): number {
  if (key === "basic") return 0;
  if (key === "pro") return 1;
  if (key === "team") return 2;
  return 3;
}

function formatStars(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `⭐${Math.max(0, Math.round(safe))}`;
}

function shouldReduceMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function usageToneFromPercent(percent: number): UsageTone {
  if (percent >= 100) return "crit";
  if (percent >= 80) return "warn";
  return "ok";
}

function periodLabelForHero(durationDays: number): string {
  if (durationDays >= LIFETIME_DURATION_THRESHOLD) return "Lifetime";
  if (durationDays > YEARLY_DURATION_THRESHOLD) return "Annual";
  return "Monthly";
}

function historyStatusLabel(status: WebAppBillingHistoryStatus): string {
  if (status === "paid") return "Paid";
  if (status === "failed") return "Failed";
  if (status === "refunded") return "Refunded";
  return "Pending";
}

function historyStatusClass(status: WebAppBillingHistoryStatus): "paid" | "pend" | "crit" {
  if (status === "paid") return "paid";
  if (status === "failed") return "crit";
  return "pend";
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

function compactInvoiceRef(ref: string): string {
  const compact = ref.replace(/^webapp:telegram_stars:/, "INV-");
  return compact.length > 18 ? `${compact.slice(0, 18)}…` : compact;
}

function formatHistoryDate(iso: string): string {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return "—";
  return value.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface NextStepCardConfig {
  title: string;
  description: string;
  alertTone: "info" | "warning" | "success";
  alertTitle: string;
  alertMessage: string;
  primaryLabel: string;
  primaryTo?: string;
  primaryAction?: () => void;
  secondaryLabel?: string;
  secondaryTo?: string;
  badgeTone: "blue" | "amber" | "green" | "neutral";
  badgeLabel: string;
}

function featuresForTier(key: string): TierFeature[] {
  if (key === "basic") {
    return [
      { id: "devices", icon: "yes", text: "Connected devices", value: "1 slot" },
      { id: "network", icon: "yes", text: "AmneziaWG protocol", value: "AWG" },
      { id: "killswitch", icon: "no", text: "Kill switch" },
    ];
  }
  if (key === "pro") {
    return [
      { id: "devices", icon: "yes", text: "Connected devices", value: "3 slots" },
      { id: "network", icon: "yes", text: "AmneziaWG protocol", value: "AWG" },
      { id: "support", icon: "amber", text: "Priority support", value: "Fast lane" },
    ];
  }
  if (key === "team") {
    return [
      { id: "devices", icon: "yes", text: "Connected devices", value: "10 slots" },
      { id: "network", icon: "yes", text: "AmneziaWG protocol", value: "AWG" },
      { id: "support", icon: "amber", text: "Shared workspace", value: "Team" },
    ];
  }
  return [
    { id: "devices", icon: "yes", text: "Connected devices", value: "Flexible" },
    { id: "network", icon: "yes", text: "AmneziaWG protocol", value: "AWG" },
  ];
}

function buildTierPairs(plans: PlanItem[], currentPlanId: string | null): TierPair[] {
  const grouped = new Map<string, TierPair>();

  for (const plan of plans) {
    const fallbackName = plan.name?.trim() || plan.id;
    const key = normalizeTierKey(fallbackName);
    const existing = grouped.get(key) ?? {
      key,
      label: tierLabelForKey(key, fallbackName),
      description: tierDescriptionForKey(key),
      monthly: undefined,
      annual: undefined,
      isCurrent: false,
      features: featuresForTier(key),
    };

    if (plan.duration_days > YEARLY_DURATION_THRESHOLD) {
      if (!existing.annual || plan.duration_days > existing.annual.duration_days) {
        existing.annual = plan;
      }
    } else if (!existing.monthly || plan.duration_days < existing.monthly.duration_days) {
      existing.monthly = plan;
    }

    if (plan.id === currentPlanId) {
      existing.isCurrent = true;
    }

    grouped.set(key, existing);
  }

  return Array.from(grouped.values()).sort((a, b) => {
    const rankDelta = tierSortRank(a.key) - tierSortRank(b.key);
    if (rankDelta !== 0) return rankDelta;
    return a.label.localeCompare(b.label);
  });
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
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const {
    plans,
    activeSub,
    primarySub,
    isSubscribed,
    subscriptionState,
    showUpsellExpiry,
    showUpsellTrialEnd,
    renewalTargetTo,
    upgradeTargetTo,
    recommendedRoute,
    routeReason,
    track,
  } = model;
  const showRenewOrUpgradeCta = showUpsellExpiry || showUpsellTrialEnd;
  const usageData = model.usageQuery.data;
  const billingHistoryData = model.historyQuery.data;
  const historyLoading = model.historyQuery.isLoading;
  const historyError = model.historyQuery.error;

    const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("annual");
    const [selectedTierKey, setSelectedTierKey] = useState<string>("");
    const [barsReady, setBarsReady] = useState<boolean>(() => isE2EMode());
    const [historyExpanded, setHistoryExpanded] = useState<boolean>(false);
    const [planIdCopied, setPlanIdCopied] = useState<boolean>(false);
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

    const planMap = useMemo(() => new Map(plans.map((plan) => [plan.id, plan])), [plans]);
    const heroPlan = primarySub ? planMap.get(primarySub.plan_id) : undefined;

    const tierPairs = useMemo(
      () => buildTierPairs(plans, primarySub?.plan_id ?? null),
      [plans, primarySub?.plan_id],
    );
    const hasAnnualOptions = tierPairs.some((tier) => tier.annual != null);
    const currentTier = tierPairs.find((tier) => tier.isCurrent) ?? null;
    const currentTierRank = currentTier ? tierSortRank(currentTier.key) : -1;
    const daysLeftForVisibility = primarySub?.valid_until
      ? Math.max(0, Math.ceil((new Date(primarySub.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;
    const showCurrentTierForRenewal = isSubscribed && primarySub != null && daysLeftForVisibility <= 30;
    const visibleTierPairs = useMemo(() => {
      if (!isSubscribed) return tierPairs;
      if (showCurrentTierForRenewal) return tierPairs;
      return tierPairs.filter((tier) => tierSortRank(tier.key) > currentTierRank);
    }, [currentTierRank, isSubscribed, showCurrentTierForRenewal, tierPairs]);
    const shouldShowPlanOptions = !isSubscribed || showCurrentTierForRenewal || visibleTierPairs.length > 0;

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
      if (!planIdCopied) return;
      const resetTimer = window.setTimeout(() => setPlanIdCopied(false), COPY_FEEDBACK_MS);
      return () => window.clearTimeout(resetTimer);
    }, [planIdCopied]);

    const activeDeviceCount = model.sessionQuery.data?.devices?.filter((d: { revoked_at?: string | null }) => !d.revoked_at).length ?? 0;
    const deviceLimit = primarySub?.device_limit ?? 0;

    const daysLeft = useMemo(() => {
      if (!primarySub?.valid_until) return 0;
      const expiresAt = new Date(primarySub.valid_until).getTime();
      if (Number.isNaN(expiresAt)) return 0;
      return Math.max(0, Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24)));
    }, [primarySub?.valid_until]);

    const heroDurationDays = heroPlan?.duration_days ?? 30;
    const isLifetimePlan =
      !!heroPlan &&
      (heroPlan.duration_days >= LIFETIME_DURATION_THRESHOLD ||
        /lifetime/i.test(heroPlan.name ?? ""));
    const expiryPercent = isLifetimePlan
      ? 99.9
      : subscriptionState === "expired"
        ? 0
        : clamp((daysLeft / Math.max(heroDurationDays, 1)) * 100, 0, 100);

    const totalTrafficBytes = useMemo(
      () =>
        (usageData?.points ?? []).reduce(
          (sum, point) => sum + (point.bytes_in ?? 0) + (point.bytes_out ?? 0),
          0,
        ),
      [usageData?.points],
    );

    const devicePercent =
      deviceLimit > 0 ? clamp((activeDeviceCount / deviceLimit) * 100, 0, 100) : 0;
    const dataPercent = activeSub
      ? clamp((totalTrafficBytes / DEFAULT_USAGE_SOFT_CAP_BYTES) * 100, 0, 100)
      : 0;
    const uptimePercent = !activeSub
      ? 0
      : typeof usageData?.sessions === "number" && activeDeviceCount > 0
        ? clamp((usageData.sessions / activeDeviceCount) * 100, 0, 100)
        : 99.8;

    const deviceTone = usageToneFromPercent(devicePercent);
    const dataTone = usageToneFromPercent(dataPercent);
    const uptimeTone = usageToneFromPercent(uptimePercent);

    const animatedDevicePercentClass = getPercentClass(barsReady ? Math.round(devicePercent) : 0);
    const animatedDataPercentClass = getPercentClass(barsReady ? Math.round(dataPercent) : 0);
    const animatedUptimePercentClass = getPercentClass(barsReady ? Math.round(uptimePercent) : 0);

    useEffect(() => {
      if (isE2EMode()) {
        setBarsReady(true);
        return undefined;
      }
      setBarsReady(false);
      const timer = window.setTimeout(() => setBarsReady(true), BAR_ANIMATION_DELAY_MS);
      return () => window.clearTimeout(timer);
    }, [expiryPercent, devicePercent, dataPercent, uptimePercent]);

    const selectedTier = tierPairs.find((tier) => tier.key === selectedTierKey) ?? tierPairs[0];
    const selectedTierPlan = selectedTier
      ? billingPeriod === "annual"
        ? selectedTier.annual ?? selectedTier.monthly
        : selectedTier.monthly ?? selectedTier.annual
      : undefined;
    const heroPlanId = primarySub?.plan_id ?? selectedTierPlan?.id ?? null;
    const compactPlanId = heroPlanId ? `${heroPlanId.slice(0, 8)}···` : "--";

    const heroPlanName = heroPlan?.name?.trim() || (primarySub?.plan_id ?? "No active plan");
    const heroPlanPeriod = periodLabelForHero(heroPlan?.duration_days ?? 30);
    const heroStars = heroPlan?.price_amount ?? selectedTierPlan?.price_amount ?? 0;
    const heroPeriodDetail = heroPlan
      ? `for ${heroPlan.duration_days} days`
      : selectedTierPlan
        ? `for ${selectedTierPlan.duration_days} days`
        : "";
    const expiryText = primarySub?.valid_until
      ? new Date(primarySub.valid_until).toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "No active subscription";
    const expiryFillClass =
      subscriptionState === "expired"
        ? "crit"
        : subscriptionState === "expiring"
          ? "warn"
          : "ok";

    const historyItems = billingHistoryData?.items ?? [];
    const visibleHistoryItems = historyExpanded ? historyItems : historyItems.slice(0, 3);
    const canExpandHistory = historyItems.length > 3;
    const billingHistoryView = visibleHistoryItems.map((item: WebAppBillingHistoryItem) => {
      const statusClass = historyStatusClass(item.status);
      return {
        id: item.payment_id,
        icon: historyIcon(statusClass),
        iconTone: statusClass === "crit" ? "r" : statusClass === "paid" ? "g" : "a",
        title: item.plan_name,
        subtitle: `${formatHistoryDate(item.created_at)} · Invoice No. ${compactInvoiceRef(item.invoice_ref ?? item.payment_id)}`,
        amount: formatStars(item.amount),
        statusLabel: historyStatusLabel(item.status),
        statusVariant: statusClass === "crit" ? "offline" : statusClass,
      } as const;
    });

    if (model.pageState.status === "empty") {
      return <SessionMissing />;
    }

    if (model.pageState.status === "error") {
      return (
        <FallbackScreen
          title={model.pageState.title ?? "Could not load"}
          message={model.pageState.message ?? "We could not load your plan or options. Please try again or contact support."}
          onRetry={() => {
            queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.me()] });
            queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.plans()] });
            queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.paymentsHistoryRoot()] });
          }}
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

    const copyPlanId = async () => {
      if (!heroPlanId) return;
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(heroPlanId);
        }
      } catch {
        // no-op: tap feedback still applies even when clipboard API is unavailable.
      }
      setPlanIdCopied(true);
    };

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

    const renewLabel =
      subscriptionState === "expiring" || subscriptionState === "expired"
        ? showRenewOrUpgradeCta
          ? "Renew plan"
          : "View plans"
        : isSubscribed
          ? "Upgrade Plan"
          : "Choose plan";
    const manageLabel = routeReason === "no_device" ? "Issue Device" : "Manage Devices";

    const autoRenewDescription =
      isSubscribed && autoRenew && primarySub?.valid_until
        ? `Renews on ${new Date(primarySub.valid_until).toLocaleDateString(undefined, {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}`
        : "Renews automatically when your plan is active.";

    const nextStepCard: NextStepCardConfig | null = (() => {
      if (!isSubscribed) {
        return {
          title: "Setup",
          description: "Choose a plan first, then continue device setup in the next step.",
          alertTone: "info",
          alertTitle: "No active subscription",
          alertMessage: "Your account is signed in, but access starts only after plan activation.",
          primaryLabel: "Compare plans",
          primaryAction: scrollToPlans,
          secondaryLabel: "Open support",
          secondaryTo: "/support",
          badgeTone: "blue",
          badgeLabel: "Step 1",
        };
      }
      if (routeReason === "no_device") {
        return {
          title: "Setup",
          description: "Billing is active. The next step is issuing your first device.",
          alertTone: "warning",
          alertTitle: "Setup is not complete",
          alertMessage: "You still need a device config before you can connect.",
          primaryLabel: "Open device setup",
          primaryTo: recommendedRoute,
          secondaryLabel: "Open support",
          secondaryTo: "/support",
          badgeTone: "amber",
          badgeLabel: "Step 2",
        };
      }
      if (routeReason === "connection_not_confirmed") {
        return {
          title: "Setup",
          description: "A device exists, but the connection is not confirmed yet.",
          alertTone: "warning",
          alertTitle: "Connection pending",
          alertMessage: "Finish the connection check so the app can move you to the active dashboard flow.",
          primaryLabel: "Continue setup",
          primaryTo: recommendedRoute,
          secondaryLabel: "Open devices",
          secondaryTo: "/devices",
          badgeTone: "amber",
          badgeLabel: "Step 3",
        };
      }
      if (routeReason === "grace" || routeReason === "expired_with_grace") {
        return {
          title: "Access state",
          description: "Your plan is outside the normal active state, but grace access is still available.",
          alertTone: "warning",
          alertTitle: "Grace period active",
          alertMessage: "Restore billing before grace ends to avoid losing access.",
          primaryLabel: "Restore access",
          primaryTo: recommendedRoute,
          secondaryLabel: "View support",
          secondaryTo: "/support",
          badgeTone: "amber",
          badgeLabel: "Grace",
        };
      }
      if (routeReason === "cancelled_at_period_end") {
        return {
          title: "Access state",
          description: "Your subscription is still active, but it is set to stop at the period end.",
          alertTone: "info",
          alertTitle: "Access remains active",
          alertMessage: "Review billing settings if you want to keep renewal turned on.",
          primaryLabel: "Open settings",
          primaryTo: "/settings",
          secondaryLabel: "Open devices",
          secondaryTo: "/devices",
          badgeTone: "blue",
          badgeLabel: "Scheduled",
        };
      }
      return null;
    })();

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
          planName={`${heroPlanName} — ${heroPlanPeriod}`}
          planSubline="AmneziaWG · amnezia-awg"
          priceMain={formatStars(heroStars)}
          period={heroPeriodDetail}
          validUntil={expiryText}
          expiryPercent={barsReady ? Math.round(expiryPercent) : 0}
          expiryFillClass={expiryFillClass}
          planId={planIdCopied ? "copied ✓" : compactPlanId}
          devicesLabel={
            deviceLimit > 0 ? `${activeDeviceCount} / ${deviceLimit}` : `${activeDeviceCount}`
          }
          protocolLabel="AWG"
          onCopyPlanId={heroPlanId ? copyPlanId : undefined}
          onRenew={handleHeroRenew}
          renewLabel={renewLabel}
          onManage={isSubscribed ? handleHeroSecondary : undefined}
          manageLabel={manageLabel}
          status={subscriptionState}
          className="stagger-1"
        />
      </section>

      {nextStepCard ? (
        <PageCardSection
          title={nextStepCard.title}
          description={nextStepCard.description}
          action={<MissionChip tone={nextStepCard.badgeTone} className="section-meta-chip">{nextStepCard.badgeLabel}</MissionChip>}
          className="stagger-2"
        >
          <MissionAlert
            tone={nextStepCard.alertTone}
            title={nextStepCard.alertTitle}
            message={nextStepCard.alertMessage}
          />
          <div className="btn-row">
            {nextStepCard.primaryTo ? (
              <MissionPrimaryLink to={nextStepCard.primaryTo}>{nextStepCard.primaryLabel}</MissionPrimaryLink>
            ) : (
              <MissionPrimaryButton onClick={nextStepCard.primaryAction}>
                {nextStepCard.primaryLabel}
              </MissionPrimaryButton>
            )}
            {nextStepCard.secondaryLabel && nextStepCard.secondaryTo ? (
              <MissionSecondaryLink to={nextStepCard.secondaryTo}>
                {nextStepCard.secondaryLabel}
              </MissionSecondaryLink>
            ) : null}
          </div>
        </PageCardSection>
      ) : null}

        {isSubscribed && (
        <PageSection title="Renewal" className="stagger-3">
          <ToggleRow
            name="Auto-renew"
            description={autoRenewDescription}
            checked={autoRenew}
            onChange={handleAutoRenewChange}
            className="stagger-3"
          />
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

        <SnapCarousel
          ref={carouselRef}
          className="snap-carousel--cards"
          id="availablePlans"
          role="region"
          aria-label="Plans carousel"
          tabIndex={0}
          onKeyDown={onCarouselKeyDown}
        >
          {visibleTierPairs.length === 0 ? (
            <article className="tier-card tier-card--empty">
              <div className="tier-body">
                <div className="tier-name">{isSubscribed ? "You're on the highest plan" : "No plans available"}</div>
              <div className="tier-desc">
                  {isSubscribed
                    ? "No higher-tier plans are available right now."
                    : "Try again later or contact support."}
                </div>
              </div>
            </article>
          ) : (
            visibleTierPairs.map((tier, index) => {
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
                  priceMain={formatStars(stars)}
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
            })
          )}
        </SnapCarousel>
      </PageSection>
      ) : null}

      {isSubscribed ? (
      <PageSection title="Usage" className="stagger-4">
        <UsageSummaryCard
          items={[
            {
              id: "devices",
              label: "Device slots",
              value: deviceLimit > 0 ? `${activeDeviceCount} / ${deviceLimit} used` : `${activeDeviceCount} used`,
              tone: deviceTone,
              progress: (
                <UsageProgressFill
                  className={`usage-fill h-fill ${deviceTone} ${animatedDevicePercentClass}`.trim()}
                  percent={barsReady ? devicePercent : 0}
                />
              ),
            },
            {
              id: "traffic",
              label: "Data transferred",
              value: activeSub ? `${formatBytes(totalTrafficBytes, { digits: 1 })} / ∞` : "--",
              tone: dataTone,
              progress: (
                <UsageProgressFill
                  className={`usage-fill h-fill ${dataTone} ${animatedDataPercentClass}`.trim()}
                  percent={barsReady ? dataPercent : 0}
                />
              ),
            },
            {
              id: "uptime",
              label: "Session uptime",
              value: activeSub ? `${uptimePercent.toFixed(1)}%` : "--",
              tone: uptimeTone,
              progress: (
                <UsageProgressFill
                  className={`usage-fill h-fill ${uptimeTone} ${animatedUptimePercentClass}`.trim()}
                  percent={barsReady ? uptimePercent : 0}
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
