import { useId } from "react";
import { Button, StatusChip } from "@/design-system";
import { useI18n } from "@/hooks/useI18n";
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
  const { t } = useI18n();
  const titleId = useId();
  const bodyId = useId();
  const stepLabelId = useId();

  return (
    <article
      className="troubleshooter-flow-card"
      aria-labelledby={titleId}
      aria-describedby={`${stepLabelId} ${bodyId}`}
    >
      <span className="troubleshooter-flow-card__accent" aria-hidden />
      <div className="troubleshooter-flow-card__inner">
        <div className="troubleshooter-flow-card__header">
          <div className="troubleshooter-flow-card__eyebrow-row">
            <span id={stepLabelId} className="troubleshooter-flow-card__eyebrow">
              {eyebrow}
            </span>
            <StatusChip variant="active" label={stepLabel} />
          </div>
          <h3 id={titleId} className="troubleshooter-flow-card__title">
            {title}
          </h3>
          <p id={bodyId} className="troubleshooter-flow-card__desc">
            {body}
          </p>
        </div>
        <div
          className="troubleshooter-flow-card__actions"
          role="group"
          aria-label={t("support.troubleshooter_actions_group", { title })}
        >
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
    </article>
  );
}
