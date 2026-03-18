import { Button, StatusChip } from "@/design-system";
import { IconShield } from "@/design-system/icons";
import { useI18n } from "@/hooks";

interface PlanBillingHeroMetaItem {
  label: string;
  value: string;
}

export interface PlanBillingHeroCardProps {
  title: string;
  statusLine: string;
  statusBadge: string;
  statusBadgeTone: "active" | "pending" | "offline";
  metaItems: PlanBillingHeroMetaItem[];
  primaryActionLabel: string;
  secondaryActionLabel?: string | null;
  onPrimaryAction: () => void;
  onSecondaryAction?: (() => void) | null;
}

export function PlanBillingHeroCard({
  title,
  statusLine,
  statusBadge,
  statusBadgeTone,
  metaItems,
  primaryActionLabel,
  secondaryActionLabel,
  onPrimaryAction,
  onSecondaryAction,
}: PlanBillingHeroCardProps) {
  const { t } = useI18n();

  return (
    <div className="modern-hero-card">
      <div className="modern-status-group">
        <div className="modern-pulse-indicator">
          <IconShield strokeWidth={2.5} size={22} />
        </div>
        <div className="modern-status-text">
          <div className="modern-header-label">{t("plan.current_plan_title")}</div>
          <div className="modern-status-title">{title}</div>
          <div className="modern-status-subtitle">
            <StatusChip variant={statusBadgeTone}>{statusBadge}</StatusChip>
            <span className="plan-hero-status-line">{statusLine}</span>
          </div>
        </div>
      </div>

      <div className="modern-metrics-row">
        {metaItems.map((item, index) => (
          <div
            key={item.label}
            className={`modern-metric-item ${index === 1 ? "modern-metric-item--centered" : index === 2 ? "modern-align-right" : ""}`}
          >
            <span className="modern-metric-label">{item.label}</span>
            <span className="modern-metric-value plan-hero-metric-value">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="plan-hero-button-group">
        <Button variant="primary" fullWidth size="lg" onClick={onPrimaryAction}>
          {primaryActionLabel}
        </Button>
        {secondaryActionLabel && onSecondaryAction && (
          <Button variant="secondary" className="plan-hero-secondary-button" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
