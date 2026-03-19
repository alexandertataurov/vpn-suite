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
}: SetupCardContentProps) {
  const { t } = useI18n();
  const title =
    step === "issue"
      ? t("devices.setup_issue_title")
      : t("devices.setup_pending_title");
  const body =
    step === "issue"
      ? "Import the config in AmneziaVPN, connect there, then return here if needed."
      : "Import the config in AmneziaVPN, connect there, then return here if needed.";
  const alertMessage =
    step === "issue"
      ? "Use the latest config for one device, then confirm setup if needed."
      : "Use the latest config for one device, then confirm setup if needed.";

  return (
    <div className="devices-setup-card">
      <span className="devices-setup-card__accent" aria-hidden />
      <div className="devices-setup-card__inner">
        <div className="devices-setup-card__eyebrow">{t("devices.section_setup_title")}</div>
        <div>
          <h3 className="devices-setup-card__title">{step === "issue" ? "Connect in AmneziaVPN" : title}</h3>
          <p className="devices-setup-card__desc">{body}</p>
        </div>
        <InlineAlert variant="info" message={alertMessage} />
      </div>
    </div>
  );
}
