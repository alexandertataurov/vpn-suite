import {
  MissionCard,
  MissionChip,
  MissionModuleHead,
  MissionPrimaryButton,
  MissionSecondaryButton,
} from "./MissionPrimitives";

export interface TroubleshooterStepProps {
  stepIndex: number;
  totalSteps: number;
  title: string;
  body: string;
  nextLabel: string;
  onNext: () => void;
  backLabel?: string;
  onBack?: () => void;
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
}: TroubleshooterStepProps) {
  return (
    <MissionCard tone="amber" className="module-card support-step">
      <MissionModuleHead
        label="Flow"
        chip={<MissionChip tone="neutral">Step {stepIndex}/{totalSteps}</MissionChip>}
      />
      <h3 className="op-name type-h3">{title}</h3>
      <p className="op-desc type-body-sm">{body}</p>
      <div className="btn-row">
        {onBack && backLabel && (
          <MissionSecondaryButton onClick={onBack}>
            {backLabel}
          </MissionSecondaryButton>
        )}
        <MissionPrimaryButton onClick={onNext}>
          {nextLabel}
        </MissionPrimaryButton>
      </div>
    </MissionCard>
  );
}
