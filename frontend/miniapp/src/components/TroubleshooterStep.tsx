import { Panel, Button, Caption, H3, Body, ActionRow } from "../ui";

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
    <Panel className="card troubleshooter-step">
      <Caption>
        Step {stepIndex} of {totalSteps}
      </Caption>
      <H3 as="h3" className="troubleshooter-step-title">{title}</H3>
      <Body className="troubleshooter-step-body">{body}</Body>
      <ActionRow>
        {onBack && backLabel && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            {backLabel}
          </Button>
        )}
        <Button variant="primary" size="sm" onClick={onNext}>
          {nextLabel}
        </Button>
      </ActionRow>
    </Panel>
  );
}
