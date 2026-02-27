import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Panel, Skeleton, Button, InlineAlert, EmptyTableState } from "@vpn-suite/shared/ui";
import { getWebappToken, webappApi } from "../api/client";

interface PlanItem {
  id: string;
  name?: string;
  duration_days: number;
  price_amount: string;
  price_currency: string;
}
interface PlansResponse {
  items: PlanItem[];
}

export function PlansPage() {
  const hasToken = !!getWebappToken();
  const { data, isLoading, error } = useQuery({
    queryKey: ["webapp", "plans"],
    queryFn: () => webappApi.get<PlansResponse>("/webapp/plans"),
    enabled: hasToken,
  });

  if (!hasToken) {
    return (
      <div className="page-content">
        <h1 className="miniapp-page-title">Plans</h1>
        <InlineAlert
          variant="warning"
          title="Session missing"
          message="Your Telegram session is not active. Close and reopen the mini app from the bot."
        />
        <Link to="/" className="miniapp-back-link">Back</Link>
      </div>
    );
  }
  if (error) {
    return (
      <div className="page-content">
        <h1 className="miniapp-page-title">Plans</h1>
        <InlineAlert
          variant="error"
          title="Could not load plans"
          message="Please try again in a few seconds. If the issue persists, contact support."
        />
        <Link to="/" className="miniapp-back-link">Back</Link>
      </div>
    );
  }
  if (isLoading || !data) {
    return (
      <div className="page-content">
        <h1 className="miniapp-page-title">Plans</h1>
        <Skeleton height={200} />
      </div>
    );
  }

  const plans = data.items;
  const numericPlans = plans.map((p) => ({
    ...p,
    price: Number(p.price_amount),
  }));
  const minDuration = Math.min(...numericPlans.map((p) => p.duration_days));
  const maxDuration = Math.max(...numericPlans.map((p) => p.duration_days));
  const monthlyPlan = numericPlans.find((p) => p.duration_days <= 31) ?? numericPlans[0];
  const baseDaily = monthlyPlan.price / monthlyPlan.duration_days;

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
      <Link to="/" className="miniapp-back-link">Back</Link>
      <p className="fs-xs text-muted mb-sm">
        Active users on the most popular plan: <strong>62%</strong>
      </p>
      <div className="miniapp-plan-list">
        {numericPlans.map((plan) => {
          const perMonth = Math.round((plan.price / plan.duration_days) * 30);
          const badge =
            plan.duration_days === maxDuration
              ? "Best value"
              : plan.duration_days === minDuration
              ? undefined
              : "Most popular";
          const baselineMonthly = Math.round(baseDaily * 30);
          const savingsPercent =
            plan.duration_days > monthlyPlan.duration_days
              ? Math.max(
                  0,
                  Math.round(
                    (1 - perMonth / (baselineMonthly || perMonth || 1)) * 100,
                  ),
                )
              : 0;
          return (
            <Panel key={plan.id} className="miniapp-plan-card">
              <div className="flex justify-between items-center mb-xs">
                <h3 className="mt-0 mb-0">{plan.name ?? plan.id}</h3>
                {badge && (
                  <span className="badge badge-pill badge-soft-primary fs-xs">
                    {badge}
                  </span>
                )}
              </div>
              <p className="mb-xs">
                <strong>{plan.price}</strong> {plan.price_currency} ·{" "}
                {plan.duration_days} days
              </p>
              <p className="fs-sm text-muted mb-xs">
                ≈ {perMonth} {plan.price_currency}/month
                {savingsPercent > 0 ? ` · Save ${savingsPercent}%` : ""}
              </p>
              <p className="fs-xs text-muted mb-sm">
                Includes secure tunnel and up to{" "}
                <strong>{plan.duration_days >= 365 ? 5 : 3}</strong> devices.
              </p>
              <Link to={`/plan/checkout/${plan.id}`}>
                <Button size="lg" className="w-full">
                  Get {plan.name ?? plan.id}
                </Button>
              </Link>
            </Panel>
          );
        })}
      </div>
      {plans.length === 0 ? (
        <EmptyTableState
          className="table-empty"
          title="No plans available"
          description="Plans will appear here when your provider configures them."
        />
      ) : null}
    </div>
  );
}
