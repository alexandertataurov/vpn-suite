import { InlineAlert } from "../../../components/feedback/InlineAlert";
import { useI18n } from "@/hooks";
import { MissionPrimaryButton } from "../../patterns";
import { CompactSummaryCard } from "../shared/CompactSummaryCard";
import "./SetupCardContent.css";

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
  canAddDevice = true,
  isAddPending = false,
  issueActionLabel,
}: SetupCardContentProps) {
  const { t } = useI18n();
  const title =
    step === "subscription"
      ? t("plan.cta_choose_plan")
      : step === "issue"
        ? t("devices.setup_issue_title")
        : t("devices.setup_connect_title");
  const body =
    step === "subscription"
      ? t("devices.setup_subscription_note")
      : step === "issue"
        ? t("devices.setup_issue_body")
        : t("devices.setup_pending_body");
  const alertMessage =
    step === "subscription"
      ? t("devices.setup_subscription_note")
      : step === "issue"
        ? t("devices.setup_flow_alert")
        : t("devices.setup_pending_note");
  const showIssueAction = step === "issue" && typeof onIssueDevice === "function";
  const tone = step === "pending" ? "amber" : "blue";

  return (
    <CompactSummaryCard
      className="devices-setup-card"
      eyebrow={t("devices.section_setup_title")}
      title={title}
      subtitle={body}
      tone={tone}
      actions={showIssueAction ? (
        <MissionPrimaryButton
          status={isAddPending ? "loading" : "idle"}
          statusText={t("devices.wizard_creating")}
          disabled={!canAddDevice || isAddPending}
          onClick={onIssueDevice}
          fullWidth
        >
          {issueActionLabel ?? t("devices.add_new_device")}
        </MissionPrimaryButton>
      ) : undefined}
      footer={(
        <InlineAlert
          variant={step === "pending" ? "warning" : "info"}
          message={alertMessage}
          compact
        />
      )}
    />
  );
}
