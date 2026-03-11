import { ButtonRow, ListCard, ListRow, MissionSecondaryLink, PageSection } from "@/design-system";
import { useI18n } from "@/hooks/useI18n";

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
      className="plan-billing-page__secondary-section stagger-6"
    >
      <ListCard title={t("plan.payment_history_title")}>
        {loading ? (
          <>
            <ListRow title={t("plan.payment_history_loading")} />
            <ListRow title={t("plan.payment_history_loading")} />
          </>
        ) : error ? (
          <ListRow title={t("plan.payment_history_error")} />
        ) : (
          items.map((item) => (
            <ListRow
              key={item.id}
              title={item.title}
              subtitle={item.subtitle}
              right={<span className="miniapp-tnum">{item.amount}</span>}
            />
          ))
        )}
      </ListCard>
      {canExpand ? (
        <ButtonRow>
          <MissionSecondaryLink
            to="#"
            onClick={(event) => {
              event.preventDefault();
              onToggleExpanded();
            }}
          >
            {expanded ? t("plan.payment_history_show_recent") : t("plan.payment_history_view_all")}
          </MissionSecondaryLink>
        </ButtonRow>
      ) : null}
    </PageSection>
  );
}
