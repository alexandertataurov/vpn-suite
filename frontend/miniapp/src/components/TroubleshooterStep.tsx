import { Panel, Button } from "@vpn-suite/shared/ui";

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
      <p className="text-muted fs-sm mb-sm">
        Step {stepIndex} of {totalSteps}
      </p>
      <h3 className="troubleshooter-step-title">{title}</h3>
      <p className="troubleshooter-step-body mb-md">{body}</p>
      <div className="flex gap-sm flex-wrap">
        {onBack && backLabel && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            {backLabel}
          </Button>
        )}
        <Button variant="primary" size="sm" onClick={onNext}>
          {nextLabel}
        </Button>
      </div>
    </Panel>
  );
}
