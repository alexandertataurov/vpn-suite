import { IconAlertTriangle } from "@/design-system/icons";
import { Button, StatusChip } from "@/design-system";
import { useI18n } from "@/hooks";

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
    <div className="troubleshooter-card">
      <div className="troubleshooter-card__head">
        <div className="troubleshooter-card__icon">
          <IconAlertTriangle size={20} strokeWidth={2.5} />
        </div>
        <div className="troubleshooter-card__meta">
          <div className="modern-header-label">{t("support.troubleshooter_flow_label")}</div>
          <div className="troubleshooter-card__title">{title}</div>
          <div className="troubleshooter-card__body">{body}</div>
        </div>
        <div className="troubleshooter-card__chip">
          <StatusChip variant="warning">
            {t("support.troubleshooter_step_chip", { index: stepIndex, total: totalSteps })}
          </StatusChip>
        </div>
      </div>

      <div className="troubleshooter-card__actions">
        {onBack && backLabel ? (
          <Button variant="secondary" className="troubleshooter-card__action" onClick={onBack}>
            {backLabel}
          </Button>
        ) : null}
        {showAlt ? (
          <Button variant="secondary" className="troubleshooter-card__action" onClick={onAlt}>
            {altLabel}
          </Button>
        ) : null}
        <Button variant="primary" className="troubleshooter-card__action troubleshooter-card__action--primary" onClick={onNext}>
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}
