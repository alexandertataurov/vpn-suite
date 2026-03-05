import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Panel,
  Skeleton,
  PageFrame,
  PageSection,
  Button,
  InlineAlert,
  ActionRow,
} from "../ui";
import { PlanCard, SubscriptionSummaryCard, FallbackScreen, SessionMissing } from "@/components";
import { useSession } from "../hooks/useSession";
import { useWebappToken, webappApi } from "../api/client";
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
  const hasToken = !!useWebappToken();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session, isLoading: sessionLoading, error: sessionError } = useSession(hasToken);
  const activeSub = session?.subscriptions?.find((s) => s.status === "active");
  useTrackScreen("plan", activeSub?.plan_id ?? null);
  const { track } = useTelemetry(activeSub?.plan_id ?? null);

  const startTrial = useMutation({
    mutationFn: () => webappApi.post<{ subscription_id: string; device_id: string; trial_ends_at: string }>("/webapp/trial/start", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webapp", "me"] });
      track("cta_click", { cta_name: "start_trial", screen_name: "plan" });
      navigate("/devices");
    },
  });

  const { data: plansData, isLoading: plansLoading, error: plansError } = useQuery({
    queryKey: ["webapp", "plans"],
    queryFn: () => webappApi.get<PlansResponse>("/webapp/plans"),
    enabled: hasToken,
  });

  const plans = plansData?.items ?? [];
  const maxDuration = plans.length ? Math.max(...plans.map((p) => p.duration_days)) : 0; // key=
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
      <PageFrame title="Subscription Console" subtitle="Plans, trial, and renewal controls">
        <Skeleton variant="card" />
      </PageFrame>
    );
  }

  if (plans.length === 0) {
    return (
      <PageFrame title="Subscription Console" subtitle="Cancel anytime. Money-back guarantee.">
        <Panel variant="surface" className="card edge et stagger-item module-card">
          <p className="type-body-sm">No plans available at the moment.</p>
          <ActionRow>
            <a aria-label="Contact support" href="https://t.me/support" target="_blank" rel="noopener noreferrer" className="link-interactive">
              CONTACT SUPPORT
            </a>
          </ActionRow>
        </Panel>
      </PageFrame>
    );
  }

  return (
    <PageFrame title="Subscription Console" subtitle="Cancel anytime. Money-back guarantee.">
      {activeSub != null && (
        <SubscriptionSummaryCard
          planId={activeSub.plan_id}
          daysLeft={daysLeft}
          status="active"
          deviceCount={session?.devices?.filter((d) => !d.revoked_at).length ?? 0}
          deviceLimit={activeSub.device_limit}
        />
      )}
      {activeSub == null && (
        <Panel variant="surface" className="card edge et stagger-item module-card">
          <p className="type-body-sm">No active subscription. Start a trial or choose a plan below.</p>
          {startTrial.error != null && (
            <InlineAlert
              variant="error"
              title="Trial"
              message={
                (startTrial.error as { response?: { data?: { detail?: { code?: string } } } })?.response?.data?.detail?.code === "TRIAL_ALREADY_USED"
                  ? "You already used your free trial."
                  : (startTrial.error as { statusCode?: number }).statusCode === 503
                    ? "Trial not available right now. Please choose a plan below."
                    : "Could not start trial. Try again or choose a plan."
              }
            />
          )}
          <ActionRow fullWidth>
            <Button
              variant="secondary"
              size="lg"
              loading={startTrial.isPending}
              disabled={startTrial.isPending}
              onClick={() => startTrial.mutate()}
            >
              START FREE TRIAL
            </Button>
          </ActionRow>
        </Panel>
      )}
      <PageSection
        title="AVAILABLE TIERS"
        action={<span className="chip cn section-meta-chip miniapp-tnum">{plans.length} TIERS</span>}
      >
        <div className="stack">
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
      </PageSection>
    </PageFrame>
  );
}
