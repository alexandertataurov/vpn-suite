import { Panel, ButtonLink, H3, Caption, Body } from "../ui";

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
      className={`card instrument-card stagger-item ${isCurrent ? "instrument-card--active" : "instrument-card--inactive"} plan-card ${isBestValue ? "plan-card-best" : ""} ${isCurrent ? "plan-card-current" : ""}`}
    >
      {isBestValue && (
        <span className="plan-card-badge">Best value</span>
      )}
      <H3 as="h3" className="plan-card-name tracking-trim data-truncate">{name}</H3>
      <Caption className="plan-card-duration" tabular>
        {durationDays} days
      </Caption>
      <Body className="plan-card-price" tabular>
        {priceAmount} {priceCurrency}
      </Body>
      {!isCurrent && (
        <ButtonLink
          to={checkoutPath}
          variant="primary"
          size="lg"
          onClick={() => onSelect?.(id)}
        >
          Get {name}
        </ButtonLink>
      )}
    </Panel>
  );
}
