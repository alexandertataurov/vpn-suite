import { ButtonLink } from "../ui";

export interface HomePrimaryActionZoneProps {
  primaryLabel: string;
  primaryTo: string;
  onPrimaryClick?: () => void;
  secondaryLabel?: string;
  secondaryTo?: string;
}

export function HomePrimaryActionZone({
  primaryLabel,
  primaryTo,
  onPrimaryClick,
  secondaryLabel,
  secondaryTo,
}: HomePrimaryActionZoneProps) {
  return (
    <div className="home-primary-action-zone stagger-item">
      <ButtonLink
        to={primaryTo}
        kind="connect"
        className="home-primary-cta"
        onClick={onPrimaryClick}
      >
        {primaryLabel}
      </ButtonLink>
      {secondaryLabel && secondaryTo && (
        <ButtonLink
          to={secondaryTo}
          variant="secondary"
          className="home-secondary-cta"
        >
          {secondaryLabel}
        </ButtonLink>
      )}
    </div>
  );
}
