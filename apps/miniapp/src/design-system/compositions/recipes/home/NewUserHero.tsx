import type { ReactNode } from "react";
import { ButtonRowAuto } from "@/design-system";
import { Button } from "../../../components/Button";
import { IconShield } from "../../../icons";
import { ModernHeroCard } from "./ModernHeroCard";

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
  const primary = primaryAction ??
    (onChoosePlan != null ? (
      <Button variant="primary" fullWidth className="new-user-hero-cta" onClick={onChoosePlan}>
        {choosePlanLabel}
      </Button>
    ) : null);
  const secondary = secondaryAction ??
    (onViewGuide != null ? (
      <Button variant="secondary" className="new-user-hero-cta" onClick={onViewGuide}>
        {viewGuideLabel}
      </Button>
    ) : null);

  const actions =
    primary != null && secondary != null ? (
      <ButtonRowAuto>
        {primary}
        {secondary}
      </ButtonRowAuto>
    ) : (
      <>
        {primary}
        {secondary}
      </>
    );

  return (
    <ModernHeroCard
      icon={<IconShield size={44} strokeWidth={1.25} />}
      title={title}
      description={description}
      actions={actions}
      variant="newUser"
      className={className}
    />
  );
}
