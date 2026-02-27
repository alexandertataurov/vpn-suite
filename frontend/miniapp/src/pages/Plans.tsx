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

  return (
    <div className="page-content">
      <div className="miniapp-page-header">
        <div>
          <h1 className="miniapp-page-title">Plans</h1>
          <p className="miniapp-page-subtitle">Choose a subscription to connect</p>
        </div>
      </div>
      <Link to="/" className="miniapp-back-link">Back</Link>
      <div className="miniapp-plan-list">
        {data.items.map((plan) => (
          <Panel key={plan.id} className="miniapp-plan-card">
            <h3 className="mt-0">{plan.name ?? plan.id}</h3>
            <p>{plan.duration_days} days · {plan.price_amount} {plan.price_currency}</p>
            <Link to={"/checkout/" + plan.id}>
              <Button>Select</Button>
            </Link>
          </Panel>
        ))}
      </div>
      {data.items.length === 0 ? (
        <EmptyTableState
          className="table-empty"
          title="No plans available"
          description="Plans will appear here when your provider configures them."
        />
      ) : null}
    </div>
  );
}
