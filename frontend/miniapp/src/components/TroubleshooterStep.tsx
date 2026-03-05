import { Panel, Button, ActionRow } from "../ui";

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
    <Panel variant="surface" className="card edge et kpi">
      <div className="kpi-top">
        <span className="kpi-label">Diagnostic Flow</span>
        <span className="chip cn">Step {stepIndex}/{totalSteps}</span>
      </div>
      <h3 className="type-h4">{title}</h3>
      <p className="type-body-sm">{body}</p>
      <ActionRow>
        {onBack && backLabel && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            {backLabel.toUpperCase()}
          </Button>
        )}
        <Button variant="primary" size="sm" onClick={onNext}>
          {nextLabel.toUpperCase()}
        </Button>
      </ActionRow>
    </Panel>
  );
}
