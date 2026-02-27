import { Link } from "react-router-dom";
import { Panel } from "@vpn-suite/shared/ui";

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
    <Panel
      className={`card plan-card ${isBestValue ? "plan-card-best" : ""} ${isCurrent ? "plan-card-current" : ""}`}
    >
      {isBestValue && (
        <span className="plan-card-badge">Best value</span>
      )}
      <h3 className="plan-card-name">{name}</h3>
      <p className="plan-card-duration text-muted fs-sm">
        {durationDays} days
      </p>
      <p className="plan-card-price">
        {priceAmount} {priceCurrency}
      </p>
      {!isCurrent && (
        <Link
          to={checkoutPath}
          className="plan-card-cta button button-primary button-lg"
          onClick={() => onSelect?.(id)}
        >
          Get {name}
        </Link>
      )}
    </Panel>
  );
}
