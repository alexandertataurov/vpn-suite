import {
  ButtonRowAuto,
  CompactSummaryCard,
  HelperNote,
  MissionPrimaryButton,
  MissionPrimaryLink,
  MissionSecondaryLink,
} from "@/design-system";
import { useI18n } from "@/hooks/useI18n";

export interface PlanNextStepCardProps {
  title: string;
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
  const { t } = useI18n();

  return (
    <CompactSummaryCard
      eyebrow={t("plan.next_step_eyebrow")}
      title={title}
      subtitle={alertTitle}
      className="plan-billing-page__next-step-card"
    >
      <HelperNote tone={alertTone === "error" ? "danger" : alertTone === "warning" ? "warning" : "info"}>
        {alertMessage}
      </HelperNote>
      <ButtonRowAuto>
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
      </ButtonRowAuto>
    </CompactSummaryCard>
  );
}
