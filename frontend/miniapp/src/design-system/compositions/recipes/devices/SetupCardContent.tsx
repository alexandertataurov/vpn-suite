import { Button } from "../../../components";
import { InlineAlert } from "../../../components/feedback/InlineAlert";
import { useI18n } from "@/hooks";
import "./DeviceRecipes.css";

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

  return (
    <div className="devices-setup-card">
      <span className="devices-setup-card__accent" aria-hidden />
      <div className="devices-setup-card__inner">
        <div className="devices-setup-card__eyebrow">{t("devices.section_setup_title")}</div>
        <div>
          <h3 className="devices-setup-card__title">{title}</h3>
          <p className="devices-setup-card__desc">{body}</p>
        </div>
        <InlineAlert variant={step === "pending" ? "warning" : "info"} message={alertMessage} />
        {showIssueAction ? (
          <div className="devices-setup-card__actions">
            <Button
              type="button"
              variant="primary"
              fullWidth
              status={isAddPending ? "loading" : "idle"}
              statusText={t("devices.wizard_creating")}
              disabled={!canAddDevice || isAddPending}
              onClick={onIssueDevice}
            >
              {issueActionLabel ?? t("devices.add_new_device")}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
