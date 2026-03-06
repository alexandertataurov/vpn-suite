import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type {
  WebAppBillingHistoryItem,
  WebAppBillingHistoryResponse,
  WebAppBillingHistoryStatus,
  WebAppUsageResponse,
} from "@vpn-suite/shared";
import {
  FallbackScreen,
  SessionMissing,
  PageFrame,
  Skeleton,
  PlanHero,
  SectionDivider,
} from "@/design-system";
import { useSession } from "@/hooks/useSession";
import { useWebappToken, webappApi } from "@/api/client";
import { useTrackScreen } from "@/hooks/useTrackScreen";
import { useTelemetry } from "@/hooks/useTelemetry";
import { formatBytes } from "@/lib/utils/format";
import { getPercentClass } from "@/lib/percentClass";
import "./Plan.page.css";

type PlanStyle = "normal" | "popular" | "promotional";
type BillingPeriod = "monthly" | "annual";
type SubscriptionState = "active" | "expiring" | "expired";
type UsageTone = "ok" | "warn" | "crit";

interface PlanItem {
  id: string;
  name?: string;
  duration_days: number;
  price_amount: number;
  price_currency: string;
  style?: PlanStyle | null;
}

interface PlansResponse {
  items: PlanItem[];
}

interface TierFeature {
  id: string;
  icon: "yes" | "no" | "amber";
  text: string;
  value?: string;
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

function monthlyEquivalent(priceAmount: number, durationDays: number): number {
  if (!Number.isFinite(priceAmount) || !Number.isFinite(durationDays) || durationDays <= 0) return 0;
  return priceAmount / Math.max(durationDays / 30, 1);
}

function currencyPrefix(currency: string): string {
  const normalized = currency.toUpperCase();
  if (normalized === "USD") return "$";
  if (normalized === "EUR") return "€";
  if (normalized === "GBP") return "£";
  if (normalized === "XTR" || normalized === "STARS") return "✦";
  return `${currency} `;
}

function splitPrice(value: number): { whole: string; cents: string } {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
  const normalized = safe.toFixed(2);
  const [whole, cents] = normalized.split(".");
  return { whole: whole ?? "0", cents: `.${cents ?? "00"}` };
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

export function PlanPage() {
  const hasToken = !!useWebappToken();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session, isLoading: sessionLoading, error: sessionError } = useSession(hasToken);

  const { data: plansData, isLoading: plansLoading, error: plansError } = useQuery({
    queryKey: ["webapp", "plans"],
    queryFn: () => webappApi.get<PlansResponse>("/webapp/plans"),
    enabled: hasToken,
  });

  const { data: usageData } = useQuery<WebAppUsageResponse>({
    queryKey: ["webapp", "usage", "7d"],
    queryFn: () => webappApi.get<WebAppUsageResponse>("/webapp/usage?range=7d"),
    enabled: hasToken,
    staleTime: 60_000,
  });

  const {
    data: billingHistoryData,
    isLoading: historyLoading,
    error: historyError,
  } = useQuery<WebAppBillingHistoryResponse>({
    queryKey: ["webapp", "payments", "history", 8],
    queryFn: () =>
      webappApi.get<WebAppBillingHistoryResponse>("/webapp/payments/history?limit=8&offset=0"),
    enabled: hasToken,
  });

  const plans = useMemo(() => plansData?.items ?? [], [plansData?.items]);
  const activeSub = session?.subscriptions?.find((subscription) => subscription.status === "active") ?? null;
  const primarySub = activeSub ?? session?.subscriptions?.[0] ?? null;

  useTrackScreen("plan", primarySub?.plan_id ?? null);
  const { track } = useTelemetry(primarySub?.plan_id ?? null);

  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("annual");
  const [selectedTierKey, setSelectedTierKey] = useState<string>("");
  const [barsReady, setBarsReady] = useState<boolean>(() => isE2EMode());
  const [historyExpanded, setHistoryExpanded] = useState<boolean>(false);
  const [planIdCopied, setPlanIdCopied] = useState<boolean>(false);

  const planMap = useMemo(() => new Map(plans.map((plan) => [plan.id, plan])), [plans]);
  const heroPlan = primarySub ? planMap.get(primarySub.plan_id) : undefined;

  const tierPairs = useMemo(
    () => buildTierPairs(plans, primarySub?.plan_id ?? null),
    [plans, primarySub?.plan_id]
  );
  const hasAnnualOptions = tierPairs.some((tier) => tier.annual != null);

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

  const activeDeviceCount = session?.devices?.filter((device) => !device.revoked_at).length ?? 0;
  const deviceLimit = activeSub?.device_limit ?? 0;

  const daysLeft = useMemo(() => {
    if (!primarySub?.valid_until) return 0;
    const expiresAt = new Date(primarySub.valid_until).getTime();
    if (Number.isNaN(expiresAt)) return 0;
    return Math.max(0, Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24)));
  }, [primarySub?.valid_until]);

  const subscriptionState: SubscriptionState = !primarySub || daysLeft <= 0
    ? "expired"
    : daysLeft <= 30
      ? "expiring"
      : "active";

  const heroDurationDays = heroPlan?.duration_days ?? 30;
  const isLifetimePlan = !!heroPlan && (
    heroPlan.duration_days >= LIFETIME_DURATION_THRESHOLD ||
    /lifetime/i.test(heroPlan.name ?? "")
  );
  const expiryPercent = isLifetimePlan
    ? 99.9
    : subscriptionState === "expired"
      ? 0
      : clamp((daysLeft / Math.max(heroDurationDays, 1)) * 100, 0, 100);

  const totalTrafficBytes = useMemo(
    () => (usageData?.points ?? []).reduce(
      (sum, point) => sum + (point.bytes_in ?? 0) + (point.bytes_out ?? 0),
      0,
    ),
    [usageData?.points],
  );

  const devicePercent = deviceLimit > 0 ? clamp((activeDeviceCount / deviceLimit) * 100, 0, 100) : 0;
  const dataPercent = activeSub ? clamp((totalTrafficBytes / DEFAULT_USAGE_SOFT_CAP_BYTES) * 100, 0, 100) : 0;
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
      ? (selectedTier.annual ?? selectedTier.monthly)
      : (selectedTier.monthly ?? selectedTier.annual)
    : undefined;

  const renewPlanId = primarySub?.plan_id ?? selectedTierPlan?.id ?? null;
  const heroPlanId = primarySub?.plan_id ?? selectedTierPlan?.id ?? null;
  const compactPlanId = heroPlanId ? `${heroPlanId.slice(0, 8)}···` : "--";

  const heroPlanName = heroPlan?.name?.trim() || (primarySub?.plan_id ?? "No active plan");
  const heroPlanPeriod = periodLabelForHero(heroPlan?.duration_days ?? 30);
  const heroMonthlyPrice = heroPlan
    ? monthlyEquivalent(heroPlan.price_amount, heroPlan.duration_days)
    : selectedTierPlan
      ? monthlyEquivalent(selectedTierPlan.price_amount, selectedTierPlan.duration_days)
      : 0;
  const heroCurrency = heroPlan?.price_currency ?? selectedTierPlan?.price_currency ?? "USD";
  const heroPrice = splitPrice(heroMonthlyPrice);
  const heroPricePrefix = currencyPrefix(heroCurrency);
  const expiryText = primarySub?.valid_until
    ? new Date(primarySub.valid_until).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "No active subscription";
  const expiryFillClass =
    subscriptionState === "expired" ? "crit" : subscriptionState === "expiring" ? "warn" : "ok";

  const historyItems = billingHistoryData?.items ?? [];
  const visibleHistoryItems = historyExpanded ? historyItems : historyItems.slice(0, 3);
  const canExpandHistory = historyItems.length > 3;

  if (!hasToken) {
    return <SessionMissing />;
  }

  if (sessionError || plansError) {
    return (
      <FallbackScreen
        title="Could not load"
        message="We could not load your plan or options. Please try again or contact support."
        onRetry={() => {
          queryClient.invalidateQueries({ queryKey: ["webapp", "me"] });
          queryClient.invalidateQueries({ queryKey: ["webapp", "plans"] });
          queryClient.invalidateQueries({ queryKey: ["webapp", "payments", "history"] });
        }}
      />
    );
  }

  if (sessionLoading || plansLoading) {
    return (
      <PageFrame
        title="Plan & Billing"
        headerAction={(
          <div className="page-hd-badge page-hd-badge--active">
            <div className="pulse pulse-dot-sm" />
            Active
          </div>
        )}
        className="plan-billing-page plan-billing-page--loading"
      >
        <section><Skeleton variant="card" /></section>
        <section><Skeleton variant="card" /></section>
        <section><Skeleton variant="card" /></section>
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

  const onRenewPlan = () => {
    if (!renewPlanId) return;
    track("cta_click", {
      cta_name: "renew_plan",
      screen_name: "plan",
      plan_id: renewPlanId,
    });
    navigate(`/plan/checkout/${renewPlanId}`);
  };

  const onManagePlan = () => {
    track("cta_click", {
      cta_name: "manage_plan",
      screen_name: "plan",
      plan_id: renewPlanId ?? "none",
    });
    navigate("/settings");
  };

  return (
    <PageFrame
      title="Plan & Billing"
      headerAction={(
        <div className={`page-hd-badge page-hd-badge--${subscriptionState}`}>
          <div className="pulse pulse-dot-sm" />
          {subscriptionState === "active"
            ? "Active"
            : subscriptionState === "expiring"
              ? "Expiring"
              : "Expired"}
        </div>
      )}
      className="plan-billing-page"
    >
      <section>
        <PlanHero
          planName={`${heroPlanName} — ${heroPlanPeriod}`}
          planSubline="AmneziaWG · amnezia-awg"
          priceMain={`${heroPricePrefix}${heroPrice.whole}`}
          priceSub={heroPrice.cents}
          period="/ month"
          validUntil={expiryText}
          expiryPercent={barsReady ? Math.round(expiryPercent) : 0}
          expiryFillClass={expiryFillClass}
          planId={planIdCopied ? "copied ✓" : compactPlanId}
          devicesLabel={
            deviceLimit > 0 ? `${activeDeviceCount} / ${deviceLimit}` : `${activeDeviceCount}`
          }
          protocolLabel="AWG"
          onCopyPlanId={heroPlanId ? copyPlanId : undefined}
          onRenew={onRenewPlan}
          onManage={onManagePlan}
          status={subscriptionState}
          className="stagger-1"
        />
      </section>

      <section>
        <SectionDivider label="Available Plans" className="stagger-2" />

        <div className="toggle-row">
          <div className="toggle-label">Billing period</div>
          <div className="seg-toggle" role="tablist" aria-label="Billing period">
            <button
              type="button"
              className={`seg-btn ${billingPeriod === "monthly" ? "on" : ""}`.trim()}
              onClick={() => setBillingPeriod("monthly")}
              role="tab"
              aria-selected={billingPeriod === "monthly"}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`seg-btn ${billingPeriod === "annual" ? "on" : ""}`.trim()}
              onClick={() => setBillingPeriod("annual")}
              role="tab"
              aria-selected={billingPeriod === "annual"}
              disabled={!hasAnnualOptions}
            >
              Annual
              <span className="save-tag">−20%</span>
            </button>
          </div>
        </div>

        <div className="plans-grid" id="plansGrid">
          {tierPairs.length === 0 ? (
            <article className="tier-card tier-card--empty">
              <div className="tier-body">
                <div className="tier-name">No plans available</div>
                <div className="tier-desc">Please try again later or contact support.</div>
              </div>
            </article>
          ) : (
            tierPairs.map((tier, index) => {
              const displayed = billingPeriod === "annual"
                ? (tier.annual ?? tier.monthly)
                : (tier.monthly ?? tier.annual);
              const monthlyPlan = tier.monthly;
              const annualPlan = tier.annual;
              const selected = tier.key === selectedTierKey;
              const currentForPeriod = !!displayed && displayed.id === primarySub?.plan_id;
              const monthlyPriceValue = displayed
                ? monthlyEquivalent(displayed.price_amount, displayed.duration_days)
                : 0;
              const priceParts = splitPrice(monthlyPriceValue);
              const pricePrefix = currencyPrefix(displayed?.price_currency ?? "USD");
              const showOriginal = billingPeriod === "annual" && !!annualPlan && !!monthlyPlan;
              const originalMonthlyPrice = monthlyPlan
                ? monthlyEquivalent(monthlyPlan.price_amount, monthlyPlan.duration_days)
                : null;
              const originalParts = originalMonthlyPrice != null ? splitPrice(originalMonthlyPrice) : null;
              const periodLabel = billingPeriod === "annual"
                ? "/ month, billed annually"
                : "/ month, billed monthly";
              const selectLabel = currentForPeriod ? "Current Plan" : `Select ${tier.label}`;

              return (
                <article
                  key={tier.key}
                  className={[
                    "tier-card",
                    selected ? "selected" : "",
                    tier.isCurrent ? "featured" : "",
                    index === 0 ? "tier-card--delay-1" : index === 1 ? "tier-card--delay-2" : "tier-card--delay-3",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  data-tier={tier.key}
                  onClick={() => setSelectedTierKey(tier.key)}
                >
                  {tier.isCurrent ? <div className="popular-badge">Current plan</div> : null}
                  <div className="tier-body">
                    <div className="tier-top">
                      <div className="tier-info">
                        <div className="tier-name">{tier.label}</div>
                        <div className="tier-desc">{tier.description}</div>
                      </div>
                      <div className="tier-pricing">
                        <div className="tier-price miniapp-tnum">
                          {pricePrefix}
                          {priceParts.whole}
                          <sub>{priceParts.cents}</sub>
                        </div>
                        <div className={`tier-orig miniapp-tnum ${showOriginal ? "" : "is-hidden"}`.trim()}>
                          {showOriginal && originalParts
                            ? `${pricePrefix}${originalParts.whole}${originalParts.cents}`
                            : ""}
                        </div>
                        <div className="tier-period">{periodLabel}</div>
                      </div>
                    </div>

                    <div className="tier-features">
                      {tier.features.map((feature) => (
                        <div key={feature.id} className="feat-row">
                          <div className={`feat-ico ${feature.icon}`}>
                            {feature.icon === "yes" ? (
                              <svg fill="none" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="2" aria-hidden>
                                <path d="M2 7l3.5 3.5 6.5-6" />
                              </svg>
                            ) : feature.icon === "amber" ? (
                              <svg fill="none" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="2" aria-hidden>
                                <path d="M7 3v4.5M7 10.5v.4" />
                                <circle cx="7" cy="7" r="5.2" />
                              </svg>
                            ) : (
                              <svg fill="none" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="2" aria-hidden>
                                <path d="M3 3l8 8M11 3l-8 8" />
                              </svg>
                            )}
                          </div>
                          <div className="feat-text">{feature.text}</div>
                          {feature.value ? <div className="feat-val">{feature.value}</div> : null}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="tier-select-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedTierKey(tier.key);
                        if (!displayed || currentForPeriod) return;
                        track("cta_click", {
                          cta_name: "select_plan",
                          screen_name: "plan",
                          plan_id: displayed.id,
                        });
                        navigate(`/plan/checkout/${displayed.id}`);
                      }}
                      disabled={!displayed || currentForPeriod}
                    >
                      {currentForPeriod ? (
                        <svg fill="none" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M2 7l3.5 3.5 6.5-6" />
                        </svg>
                      ) : (
                        <svg fill="none" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M5 2l4 5-4 5" />
                        </svg>
                      )}
                      {selectLabel}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section>
        <SectionDivider label="Usage" className="stagger-4" />

        <article className="usage-card">
          <div className="usage-body">
            <div className="usage-title">Current Cycle</div>

            <div className="usage-row">
              <div className="usage-meta">
                <div className="usage-lbl">Device slots</div>
                <div className={`usage-count ${deviceTone}`}>
                  {deviceLimit > 0 ? `${activeDeviceCount} / ${deviceLimit} used` : `${activeDeviceCount} used`}
                </div>
              </div>
              <div className="usage-track h-track">
                <div className={`usage-fill h-fill ${deviceTone} ${animatedDevicePercentClass}`.trim()} />
              </div>
            </div>

            <div className="usage-row">
              <div className="usage-meta">
                <div className="usage-lbl">Data transferred</div>
                <div className={`usage-count ${dataTone}`}>
                  {activeSub ? `${formatBytes(totalTrafficBytes, { digits: 1 })} / ∞` : "--"}
                </div>
              </div>
              <div className="usage-track h-track">
                <div className={`usage-fill h-fill ${dataTone} ${animatedDataPercentClass}`.trim()} />
              </div>
            </div>

            <div className="usage-row">
              <div className="usage-meta">
                <div className="usage-lbl">Session uptime</div>
                <div className={`usage-count ${uptimeTone}`}>
                  {activeSub ? `${uptimePercent.toFixed(1)}%` : "--"}
                </div>
              </div>
              <div className="usage-track h-track">
                <div className={`usage-fill h-fill ${uptimeTone} ${animatedUptimePercentClass}`.trim()} />
              </div>
            </div>
          </div>
        </article>
      </section>

      <section>
        <SectionDivider label="Billing History" className="stagger-6" />

        <article className="history-card">
          <div className="history-body">
            <div className="history-title">Recent Transactions</div>

            {historyLoading ? (
              <div className="history-loading">
                <Skeleton variant="line" />
                <Skeleton variant="line" />
              </div>
            ) : historyError ? (
              <div className="history-empty">Could not load transaction history.</div>
            ) : visibleHistoryItems.length === 0 ? (
              <div className="history-empty">No transactions yet.</div>
            ) : (
              visibleHistoryItems.map((item: WebAppBillingHistoryItem) => {
                const statusClass = historyStatusClass(item.status);
                const statusLabel = historyStatusLabel(item.status);
                const amountParts = splitPrice(item.amount);
                return (
                  <div key={item.payment_id} className="history-row">
                    <div className={`hist-ico ${statusClass}`}>
                      {statusClass === "paid" ? (
                        <svg fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                          <rect x="2.2" y="3.2" width="11.6" height="9.6" rx="2.2" />
                          <path d="M2.2 6h11.6" />
                        </svg>
                      ) : statusClass === "crit" ? (
                        <svg fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                          <circle cx="8" cy="8" r="5.8" />
                          <path d="M8 5.3v3.2M8 10.7h.01" />
                        </svg>
                      ) : (
                        <svg fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                          <circle cx="8" cy="8" r="5.8" />
                          <path d="M8 4.8v3.4M8 10.8h.01" />
                        </svg>
                      )}
                    </div>
                    <div className="hist-body">
                      <div className="hist-plan">{item.plan_name}</div>
                      <div className="hist-date">
                        {formatHistoryDate(item.created_at)} · Invoice No. {compactInvoiceRef(item.invoice_ref ?? item.payment_id)}
                      </div>
                    </div>
                    <div className="hist-right">
                      <div className="hist-amount miniapp-tnum">
                        {currencyPrefix(item.currency)}
                        {amountParts.whole}
                        {amountParts.cents}
                      </div>
                      <div className={`hist-status ${statusClass}`}>{statusLabel}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            type="button"
            className={`history-footer ${canExpandHistory ? "" : "is-disabled"}`.trim()}
            onClick={() => {
              if (!canExpandHistory) return;
              setHistoryExpanded((value) => !value);
            }}
            disabled={!canExpandHistory}
          >
            {historyExpanded ? "Show recent transactions" : "View all transactions"}
            <svg fill="none" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M2 7h10M8 4l3 3-3 3" />
            </svg>
          </button>
        </article>
      </section>
    </PageFrame>
  );
}
