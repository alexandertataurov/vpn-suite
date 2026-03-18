import { IconChevronRight, IconCircleX, IconRotateCw, IconTrash2 } from "@/design-system/icons";
import { HelperNote, ListCard, ListRow, PageSection } from "@/design-system";

export interface SettingsDangerSectionProps {
  sectionTitle: string;
  warningText: string;
  hasActiveDevices: boolean;
  resetConfigsTitle: string;
  resetConfigsDescription: string;
  onResetConfigs: () => void;
  isRevoking: boolean;
  logoutTitle: string;
  logoutDescription: string;
  onLogout: () => void;
  isLoggingOut: boolean;
  deleteAccountTitle: string;
  deleteAccountDescription: string;
  onDeleteAccount: () => void;
}

export function SettingsDangerSection({
  sectionTitle,
  warningText,
  hasActiveDevices,
  resetConfigsTitle,
  resetConfigsDescription,
  onResetConfigs,
  isRevoking,
  logoutTitle,
  logoutDescription,
  onLogout,
  isLoggingOut,
  deleteAccountTitle,
  deleteAccountDescription,
  onDeleteAccount,
}: SettingsDangerSectionProps) {
  return (
    <PageSection
      id="destructive"
      title={sectionTitle}
      compact
      className="settings-danger-section"
    >
      <HelperNote tone="warning">{warningText}</HelperNote>
      <ListCard className="settings-list-card">
        {hasActiveDevices ? (
          <ListRow
            icon={<IconRotateCw size={15} strokeWidth={2} />}
            iconVariant="danger"
            title={resetConfigsTitle}
            subtitle={resetConfigsDescription}
            right={<IconChevronRight size={13} strokeWidth={2.5} />}
            onClick={() => !isRevoking && onResetConfigs()}
            aria-disabled={isRevoking}
          />
        ) : null}
        <ListRow
          icon={<IconCircleX size={15} strokeWidth={2} />}
          iconVariant="danger"
          title={logoutTitle}
          subtitle={logoutDescription}
          right={<IconChevronRight size={13} strokeWidth={2.5} />}
          onClick={() => !isLoggingOut && onLogout()}
          aria-disabled={isLoggingOut}
        />
        <ListRow
          icon={<IconTrash2 size={15} strokeWidth={2} />}
          iconVariant="danger"
          title={deleteAccountTitle}
          subtitle={deleteAccountDescription}
          right={<IconChevronRight size={13} strokeWidth={2.5} />}
          onClick={onDeleteAccount}
        />
      </ListCard>
    </PageSection>
  );
}
