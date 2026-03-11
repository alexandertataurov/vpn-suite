import { MissionPrimaryButton, MissionPrimaryLink, PageCardSection } from "@/design-system";
import { useI18n } from "@/hooks/useI18n";

export interface ConnectStatusVerifyCardProps {
  showConfirmAction: boolean;
  isConfirming: boolean;
  primaryAction: { label: string; to: string } | null;
  onConfirm: () => void;
}

export function ConnectStatusVerifyCard({
  showConfirmAction,
  isConfirming,
  primaryAction,
  onConfirm,
}: ConnectStatusVerifyCardProps) {
  const { t } = useI18n();

  return (
    <PageCardSection
      title={t("connect_status.verify_section_title")}
      description={t("connect_status.verify_section_description")}
    >
      <div className="miniapp-compact-actions">
        {showConfirmAction ? (
          <MissionPrimaryButton
            onClick={onConfirm}
            disabled={isConfirming}
            className="miniapp-compact-action"
          >
            {isConfirming
              ? t("connect_status.confirm_button_loading")
              : t("connect_status.confirm_button_label")}
          </MissionPrimaryButton>
        ) : primaryAction ? (
          <MissionPrimaryLink to={primaryAction.to} className="miniapp-compact-action">
            {primaryAction.label}
          </MissionPrimaryLink>
        ) : null}
      </div>
    </PageCardSection>
  );
}
