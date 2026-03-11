import {
  MissionCard,
  MissionChip,
  MissionModuleHead,
  MissionPrimaryButton,
  MissionSecondaryButton,
  ButtonRow,
} from "@/design-system";
import { useI18n } from "@/hooks/useI18n";

export interface TroubleshooterStepProps {
  stepIndex: number;
  totalSteps: number;
  title: string;
  body: string;
  nextLabel: string;
  onNext: () => void;
  backLabel?: string;
  onBack?: () => void;
  /** When set with onAlt, shows a second path (e.g. "No, choose plan"). */
  altLabel?: string;
  onAlt?: () => void;
}

export function TroubleshooterStep({
  stepIndex,
  totalSteps,
  title,
  body,
  nextLabel,
  onNext,
  backLabel,
  onBack,
  altLabel,
  onAlt,
}: TroubleshooterStepProps) {
  const { t } = useI18n();
  const showAlt = altLabel != null && onAlt != null;
  return (
    <MissionCard tone="amber" className="module-card support-step">
      <MissionModuleHead
        label={t("support.troubleshooter_flow_label")}
        chip={<MissionChip tone="neutral">{t("support.troubleshooter_step_chip", { index: stepIndex, total: totalSteps })}</MissionChip>}
      />
      <h3 className="op-name type-h3">{title}</h3>
      <p className="op-desc type-body-sm">{body}</p>
      <ButtonRow>
        {onBack && backLabel && (
          <MissionSecondaryButton onClick={onBack}>
            {backLabel}
          </MissionSecondaryButton>
        )}
        {showAlt ? (
          <>
            <MissionSecondaryButton onClick={onAlt}>
              {altLabel}
            </MissionSecondaryButton>
            <MissionPrimaryButton onClick={onNext}>
              {nextLabel}
            </MissionPrimaryButton>
          </>
        ) : (
          <MissionPrimaryButton onClick={onNext}>
            {nextLabel}
          </MissionPrimaryButton>
        )}
      </ButtonRow>
    </MissionCard>
  );
}
