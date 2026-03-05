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
    <div className="primary-action-zone">
      <ButtonLink
        to={primaryTo}
        kind="connect"
        className="btn-full-width"
        onClick={onPrimaryClick}
      >
        {primaryLabel}
      </ButtonLink>
      {secondaryLabel != null && secondaryTo != null && (
        <ButtonLink to={secondaryTo} variant="secondary" className="btn-full-width">
          {secondaryLabel}
        </ButtonLink>
      )}
    </div>
  );
}
