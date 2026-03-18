import { IconChevronRight, IconCreditCard, IconRotateCw, IconSmartphone } from "@/design-system/icons";
import { ListCard, ListRow, PageSection, ToggleRow } from "@/design-system";

export interface SettingsPlanSectionProps {
  sectionTitle: string;
  hasPlan: boolean;
  planTitle: string;
  planDescription: string;
  devicesTitle: string;
  devicesSubtitle: string;
  cancelPlanTitle: string;
  cancelPlanDescription: string;
  onPlanClick: () => void;
  onDevicesClick: () => void;
  onCancelClick: () => void;
  autoRenewTitle: string;
  autoRenewDescription: string;
  autoRenewChecked: boolean;
  autoRenewDisabled: boolean;
  autoRenewDisabledReason?: string;
  onAutoRenewChange: (checked: boolean) => void;
}

export function SettingsPlanSection({
  sectionTitle,
  hasPlan,
  planTitle,
  planDescription,
  devicesTitle,
  devicesSubtitle,
  cancelPlanTitle,
  cancelPlanDescription,
  onPlanClick,
  onDevicesClick,
  onCancelClick,
  autoRenewTitle,
  autoRenewDescription,
  autoRenewChecked,
  autoRenewDisabled,
  autoRenewDisabledReason,
  onAutoRenewChange,
}: SettingsPlanSectionProps) {
  return (
    <PageSection id="plan-management" title={sectionTitle} compact>
      <ListCard className="settings-list-card">
        <ListRow
          icon={<IconCreditCard size={15} strokeWidth={2} />}
          iconTone="neutral"
          title={planTitle}
          subtitle={planDescription}
          right={<IconChevronRight size={13} strokeWidth={2.5} />}
          onClick={() => onPlanClick()}
        />
        <ListRow
          icon={<IconSmartphone size={15} strokeWidth={2} />}
          iconTone="neutral"
          title={devicesTitle}
          subtitle={devicesSubtitle}
          right={<IconChevronRight size={13} strokeWidth={2.5} />}
          onClick={() => onDevicesClick()}
        />
        {hasPlan ? (
          <ListRow
            icon={<IconRotateCw size={15} strokeWidth={2} />}
            iconTone="amber"
            title={cancelPlanTitle}
            subtitle={cancelPlanDescription}
            right={<IconChevronRight size={13} strokeWidth={2.5} />}
            onClick={onCancelClick}
          />
        ) : null}
        <ToggleRow
          name={autoRenewTitle}
          description={autoRenewDescription}
          checked={autoRenewChecked}
          className="settings-toggle-row"
          disabled={autoRenewDisabled}
          disabledReason={autoRenewDisabledReason}
          onChange={onAutoRenewChange}
        />
      </ListCard>
    </PageSection>
  );
}
