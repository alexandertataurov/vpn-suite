import {
  CompactSummaryCard,
  MissionPrimaryButton,
  VpnBoundaryNote,
} from "@/design-system";
import { useI18n } from "@/hooks";

export type SetupStep = "subscription" | "issue" | "pending";

export interface SetupCardContentProps {
  step: SetupStep;
  onIssueDevice?: () => void;
  canAddDevice?: boolean;
  isAddPending?: boolean;
  issueActionLabel?: string;
}

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
      <CompactSummaryCard
        eyebrow={t("devices.section_setup_title")}
        title={t("plan.next_step_no_subscription_alert_title")}
        subtitle={t("plan.next_step_no_subscription_alert_message")}
        tone="blue"
      >
        <VpnBoundaryNote messageKey="devices.setup_subscription_note" />
      </CompactSummaryCard>
    );
  }

  if (step === "issue") {
    return (
      <CompactSummaryCard
        eyebrow={t("devices.section_setup_title")}
        title={t("devices.setup_issue_title")}
        subtitle={t("devices.setup_issue_body")}
        tone="blue"
        actions={(
          <MissionPrimaryButton
            onClick={onIssueDevice}
            disabled={!canAddDevice || isAddPending}
            className="miniapp-compact-action"
            status={isAddPending ? "loading" : "idle"}
            statusText={t("devices.issue_primary_label_pending")}
          >
            {issueActionLabel}
          </MissionPrimaryButton>
        )}
      >
        <VpnBoundaryNote messageKey="common.vpn_boundary_devices_note" />
      </CompactSummaryCard>
    );
  }

  return (
    <CompactSummaryCard
      eyebrow={t("devices.section_setup_title")}
      title={t("devices.setup_pending_title")}
      subtitle={t("devices.setup_pending_body")}
      tone="amber"
    >
      <VpnBoundaryNote messageKey="devices.setup_pending_note" />
    </CompactSummaryCard>
  );
}
