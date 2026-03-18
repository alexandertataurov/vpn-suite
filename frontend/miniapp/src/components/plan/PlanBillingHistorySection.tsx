import { IconFileText } from "@/design-system/icons";
import { MissionSecondaryLink, PageSection, SettingsActionRow, SettingsCard } from "@/design-system";
import { useI18n } from "@/hooks";

export interface PlanBillingHistoryItem {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
}

export interface PlanBillingHistorySectionProps {
  items: PlanBillingHistoryItem[];
  loading: boolean;
  error: boolean;
  expanded: boolean;
  canExpand: boolean;
  onToggleExpanded: () => void;
}

export function PlanBillingHistorySection({
  items,
  loading,
  error,
  expanded,
  canExpand,
  onToggleExpanded,
}: PlanBillingHistorySectionProps) {
  const { t } = useI18n();

  return (
    <PageSection
      title={t("plan.payment_history_title")}
      className="plan-billing-page__secondary-section"
    >
      <SettingsCard className="module-card settings-list-card billing-history-list-card">
        {loading ? (
          <>
            <SettingsActionRow
              icon={<IconFileText size={18} strokeWidth={1.7} />}
              title={t("plan.payment_history_loading")}
              actionIndicator="none"
            />
            <SettingsActionRow
              icon={<IconFileText size={18} strokeWidth={1.7} />}
              title={t("plan.payment_history_loading")}
              actionIndicator="none"
            />
          </>
        ) : error ? (
          <SettingsActionRow
            icon={<IconFileText size={18} strokeWidth={1.7} />}
            title={t("plan.payment_history_error")}
            actionIndicator="none"
          />
        ) : items.length === 0 ? (
          <SettingsActionRow
            icon={<IconFileText size={18} strokeWidth={1.7} />}
            title={t("plan.payment_history_empty")}
            description={t("plan.payment_history_empty_message")}
            actionIndicator="none"
          />
        ) : (
          items.map((item) => (
            <SettingsActionRow
              key={item.id}
              icon={<IconFileText size={18} strokeWidth={1.7} />}
              title={item.title}
              description={item.subtitle}
              value={item.amount}
              actionIndicator="none"
            />
          ))
        )}
      </SettingsCard>
      {canExpand ? (
        <div className="plan-billing-page__history-actions">
          <MissionSecondaryLink
            to="#"
            onClick={(event) => {
              event.preventDefault();
              onToggleExpanded();
            }}
          >
            {expanded ? t("plan.payment_history_show_recent") : t("plan.payment_history_view_all")}
          </MissionSecondaryLink>
        </div>
      ) : null}
    </PageSection>
  );
}
