import { IconFileText, IconTelegramStar } from "@/design-system/icons";
import { ListCard, ListRow, MissionSecondaryLink, PageSection } from "@/design-system";
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
      <ListCard className="home-card-row module-card settings-list-card billing-history-list-card">
        {loading ? (
          <>
            <ListRow
              icon={<IconFileText size={15} strokeWidth={2} />}
              iconTone="neutral"
              title={t("plan.payment_history_loading")}
            />
            <ListRow
              icon={<IconFileText size={15} strokeWidth={2} />}
              iconTone="neutral"
              title={t("plan.payment_history_loading")}
            />
          </>
        ) : error ? (
          <ListRow
            icon={<IconFileText size={15} strokeWidth={2} />}
            iconTone="neutral"
            title={t("plan.payment_history_error")}
          />
        ) : items.length === 0 ? (
          <ListRow
            icon={<IconFileText size={15} strokeWidth={2} />}
            iconTone="neutral"
            title={t("plan.payment_history_empty")}
            subtitle={t("plan.payment_history_empty_message")}
          />
        ) : (
          items.map((item) => (
            <ListRow
              key={item.id}
              icon={<IconFileText size={15} strokeWidth={2} />}
              iconTone="neutral"
              title={item.title}
              subtitle={item.subtitle}
              right={
                <div className="home-row-right-group">
                  <span className="settings-action-value">{item.amount}</span>
                  <IconTelegramStar width={14} height={14} className="billing-history-star" aria-hidden />
                </div>
              }
            />
          ))
        )}
      </ListCard>
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
