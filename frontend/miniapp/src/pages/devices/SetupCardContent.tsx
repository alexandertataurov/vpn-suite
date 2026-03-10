import {
  MissionAlert,
  MissionPrimaryButton,
} from "@/design-system";
import { useI18n } from "@/hooks/useI18n";

export type SetupStep = "subscription" | "issue" | "pending";

export interface SetupCardContentProps {
  step: SetupStep;
  onIssueDevice?: () => void;
  canAddDevice?: boolean;
  isAddPending?: boolean;
  issueActionLabel?: string;
}

/** Reusable setup step content: alert + actions. */
export function SetupCardContent({
  step,
  onIssueDevice,
  canAddDevice = false,
  isAddPending = false,
  issueActionLabel = "Add device",
}: SetupCardContentProps) {
  const { t } = useI18n();

  if (step === "subscription") {
    return (
      <MissionAlert
        tone="info"
        title={t("plan.next_step_no_subscription_alert_title")}
        message={t("plan.next_step_no_subscription_alert_message")}
      />
    );
  }
  if (step === "issue") {
    return (
      <MissionAlert
        tone="warning"
        title={t("devices.summary_subtitle_no_devices")}
        message={t("devices.summary_subtitle_connection_not_confirmed")}
        actions={(
          <div className="miniapp-compact-actions">
            <MissionPrimaryButton
              onClick={onIssueDevice}
              disabled={!canAddDevice || isAddPending}
              className="miniapp-compact-action"
            >
              {isAddPending ? t("devices.issue_primary_label_pending") : issueActionLabel}
            </MissionPrimaryButton>
          </div>
        )}
      />
    );
  }
  return (
    <MissionAlert
      tone="info"
      title={t("home.header_default_subtitle")}
      message={t("home.status_connecting_hint")}
    />
  );
}
