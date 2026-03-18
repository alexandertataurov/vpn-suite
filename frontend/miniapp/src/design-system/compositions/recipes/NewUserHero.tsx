import type { ReactNode } from "react";
import { Button } from "../../components/Button";
import { IconShield } from "../../icons";

export interface NewUserHeroProps {
  title: string;
  description: string;
  /** Legacy: render directly */
  primaryAction?: ReactNode;
  /** Legacy: render directly */
  secondaryAction?: ReactNode;
  /** Preferred: callback for choose plan CTA */
  onChoosePlan?: () => void;
  /** Preferred: callback for view guide CTA */
  onViewGuide?: () => void;
  /** Label when using onChoosePlan */
  choosePlanLabel?: string;
  /** Label when using onViewGuide */
  viewGuideLabel?: string;
  className?: string;
}

export function NewUserHero({
  title,
  description,
  primaryAction,
  secondaryAction,
  onChoosePlan,
  onViewGuide,
  choosePlanLabel = "Choose plan",
  viewGuideLabel = "View guide",
  className,
}: NewUserHeroProps) {
  return (
    <div className={["new-user-hero", "hero-card", className].filter(Boolean).join(" ")} data-layer="NewUserHero">
      <div className="new-user-hero-icon" aria-hidden>
        <IconShield size={44} strokeWidth={1.25} />
      </div>
      <h2 className="new-user-hero-title">{title}</h2>
      <p className="new-user-hero-desc">{description}</p>
      <div className="new-user-hero-actions">
        {primaryAction ?? (onChoosePlan != null ? (
          <Button variant="primary" fullWidth className="new-user-hero-cta" onClick={onChoosePlan}>
            {choosePlanLabel}
          </Button>
        ) : null)}
        {secondaryAction ?? (onViewGuide != null ? (
          <Button variant="secondary" fullWidth className="new-user-hero-cta" onClick={onViewGuide}>
            {viewGuideLabel}
          </Button>
        ) : null)}
      </div>
    </div>
  );
}
