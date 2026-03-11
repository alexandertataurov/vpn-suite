import { ButtonRow, MissionAlert, MissionChip, MissionPrimaryButton, MissionPrimaryLink, MissionSecondaryLink, PageCardSection } from "@/design-system";

export interface PlanNextStepCardProps {
  title: string;
  badgeLabel: string;
  badgeTone: "neutral" | "blue" | "green" | "amber" | "red";
  alertTone: "info" | "success" | "warning" | "error";
  alertTitle: string;
  alertMessage: string;
  primaryLabel: string;
  primaryTo?: string | null;
  primaryUsesScrollAction?: boolean;
  secondaryLabel?: string | null;
  secondaryTo?: string | null;
  onPrimaryScrollAction: () => void;
}

export function PlanNextStepCard({
  title,
  badgeLabel,
  badgeTone,
  alertTone,
  alertTitle,
  alertMessage,
  primaryLabel,
  primaryTo,
  primaryUsesScrollAction,
  secondaryLabel,
  secondaryTo,
  onPrimaryScrollAction,
}: PlanNextStepCardProps) {
  return (
    <PageCardSection
      title={title}
      action={<MissionChip tone={badgeTone} className="section-meta-chip">{badgeLabel}</MissionChip>}
      sectionClassName="plan-billing-page__next-step-section stagger-2"
      cardClassName="module-card plan-billing-page__next-step-card"
    >
      <MissionAlert tone={alertTone} title={alertTitle} message={alertMessage} />
      <ButtonRow>
        {primaryTo ? (
          <MissionPrimaryLink to={primaryTo}>{primaryLabel}</MissionPrimaryLink>
        ) : (
          <MissionPrimaryButton onClick={primaryUsesScrollAction ? onPrimaryScrollAction : undefined}>
            {primaryLabel}
          </MissionPrimaryButton>
        )}
        {secondaryLabel && secondaryTo ? (
          <MissionSecondaryLink to={secondaryTo} className="plan-billing-page__secondary-link">
            {secondaryLabel}
          </MissionSecondaryLink>
        ) : null}
      </ButtonRow>
    </PageCardSection>
  );
}
