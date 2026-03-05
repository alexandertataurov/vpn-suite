import { Panel, ButtonLink } from "../ui";

export interface PlanCardProps {
  id: string;
  name: string;
  durationDays: number;
  priceAmount: number;
  priceCurrency: string;
  isBestValue?: boolean;
  isCurrent?: boolean;
  onSelect?: (planId: string) => void;
}

export function PlanCard({
  id,
  name,
  durationDays,
  priceAmount,
  priceCurrency,
  isBestValue = false,
  isCurrent = false,
  onSelect,
}: PlanCardProps) {
  const checkoutPath = `/plan/checkout/${id}`;

  return (
    <Panel variant="surface" className={`card edge kpi ${isCurrent ? "eg" : "et"} stagger-item`}>
      <div className="kpi-top">
        <span className="kpi-label">Subscription Tier</span>
        <span className={`chip ${isCurrent ? "cg" : isBestValue ? "ca" : "cn"}`}>
          {isCurrent ? "Current" : isBestValue ? "Best Value" : "Available"}
        </span>
      </div>

      <div className="kv kv--sm">{name}</div>
      <p className="kpi-subline miniapp-tnum">{durationDays} day access window</p>
      <p className="plan-card-price miniapp-tnum">{priceAmount} {priceCurrency}</p>

      {!isCurrent && (
        <div className="action-row action-row--full kpi-actions">
          <ButtonLink
            to={checkoutPath}
            variant="primary"
            size="lg"
            onClick={() => onSelect?.(id)}
          >
            Select plan
          </ButtonLink>
        </div>
      )}
    </Panel>
  );
}
