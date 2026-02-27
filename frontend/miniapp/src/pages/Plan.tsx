import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Panel, Skeleton, InlineAlert } from "@vpn-suite/shared/ui";
import { PlanCard } from "../components/PlanCard";
import { SubscriptionSummaryCard } from "../components/SubscriptionSummaryCard";
import { FallbackScreen } from "../components/FallbackScreen";
import { SessionMissing } from "../components/SessionMissing";
import { useSession } from "../hooks/useSession";
import { getWebappToken, webappApi } from "../api/client";
import { useTrackScreen } from "../hooks/useTrackScreen";
import { useTelemetry } from "../hooks/useTelemetry";

interface PlanItem {
  id: string;
  name?: string;
  duration_days: number;
  price_amount: number;
  price_currency: string;
}

interface PlansResponse {
  items: PlanItem[];
}

export function PlanPage() {
  const hasToken = !!getWebappToken();
  const queryClient = useQueryClient();
  const { data: session, isLoading: sessionLoading, error: sessionError } = useSession(hasToken);
  const activeSub = session?.subscriptions?.find((s) => s.status === "active");
  useTrackScreen("plan", activeSub?.plan_id ?? null);
  const { track } = useTelemetry(activeSub?.plan_id ?? null);

  const { data: plansData, isLoading: plansLoading, error: plansError } = useQuery({
    queryKey: ["webapp", "plans"],
    queryFn: () => webappApi.get<PlansResponse>("/webapp/plans"),
    enabled: hasToken,
  });

  const plans = plansData?.items ?? [];
  const maxDuration = plans.length ? Math.max(...plans.map((p) => p.duration_days)) : 0;
  let daysLeft = 0;
  if (activeSub) {
    const expiry = new Date(activeSub.valid_until);
    daysLeft = Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  }

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
        }}
      />
    );
  }

  if (sessionLoading || plansLoading) {
    return (
      <div className="page-content">
        <h1 className="miniapp-page-title">Plan</h1>
        <Skeleton variant="card" />
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="miniapp-page-header">
        <div>
          <h1 className="miniapp-page-title">Choose Your Plan</h1>
          <p className="miniapp-page-subtitle">
            Cancel anytime. Money-back guarantee.
          </p>
        </div>
      </div>
      {activeSub && (
        <SubscriptionSummaryCard
          planId={activeSub.plan_id}
          daysLeft={daysLeft}
          status="active"
          deviceCount={session?.devices?.filter((d) => !d.revoked_at).length ?? 0}
          deviceLimit={activeSub.device_limit}
        />
      )}
      {!activeSub && (
        <Panel className="card mb-md">
          <p className="text-muted fs-sm mb-0">No active plan. Choose one below.</p>
        </Panel>
      )}
      <h2 className="miniapp-section-heading">Plans</h2>
      <div className="miniapp-plan-list">
        {plans.map((p) => (
          <PlanCard
            key={p.id}
            id={p.id}
            name={p.name ?? p.id}
            durationDays={p.duration_days}
            priceAmount={p.price_amount}
            priceCurrency={p.price_currency}
            isBestValue={p.duration_days === maxDuration && maxDuration > 0}
            isCurrent={activeSub?.plan_id === p.id}
            onSelect={(planId) => track("cta_click", { cta_name: "select_plan", screen_name: "plan", plan_id: planId })}
          />
        ))}
      </div>
      <Panel className="card mt-lg">
        <p className="text-muted fs-sm mb-xs">Billing</p>
        <p className="fs-sm mb-0">Billing history: Coming soon.</p>
      </Panel>
      <Panel className="card mt-md">
        <p className="text-muted fs-sm mb-xs">Payment</p>
        <p className="fs-sm mb-0">Pay with Telegram Stars (in-app).</p>
      </Panel>
    </div>
  );
}
