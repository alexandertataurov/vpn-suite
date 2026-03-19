import { Button, StatusChip } from "@/design-system";
import "./TroubleshooterFlowCard.css";

export interface TroubleshooterFlowCardProps {
  eyebrow: string;
  stepLabel: string;
  title: string;
  body: string;
  altAction?: { label: string; onClick: () => void };
  backAction?: { label: string; onClick: () => void };
  nextAction: { label: string; onClick: () => void };
}

/** Troubleshooter step card with accent bar, eyebrow, title, body, and action buttons. */
export function TroubleshooterFlowCard({
  eyebrow,
  stepLabel,
  title,
  body,
  altAction,
  backAction,
  nextAction,
}: TroubleshooterFlowCardProps) {
  return (
    <div className="troubleshooter-flow-card">
      <span className="troubleshooter-flow-card__accent" aria-hidden />
      <div className="troubleshooter-flow-card__inner">
        <div className="troubleshooter-flow-card__header">
          <div className="troubleshooter-flow-card__eyebrow-row">
            <span className="troubleshooter-flow-card__eyebrow">{eyebrow}</span>
            <StatusChip variant="active" label={stepLabel} />
          </div>
          <h3 className="troubleshooter-flow-card__title">{title}</h3>
          <p className="troubleshooter-flow-card__desc">{body}</p>
        </div>
        <div className="troubleshooter-flow-card__actions">
          {altAction ? (
            <Button variant="secondary" fullWidth onClick={altAction.onClick}>
              {altAction.label}
            </Button>
          ) : null}
          {backAction ? (
            <Button variant="secondary" fullWidth onClick={backAction.onClick}>
              {backAction.label}
            </Button>
          ) : null}
          <Button variant="primary" fullWidth onClick={nextAction.onClick}>
            {nextAction.label}
          </Button>
        </div>
      </div>
    </div>
  );
}
