import { useNavigate } from "react-router-dom";
import {
  PageFrame,
  PageCardSection,
  MissionPrimaryButton,
  MissionSecondaryLink,
  SessionMissing,
} from "@/design-system";
import { useConnectStatusPageModel } from "@/page-models/useConnectStatusPageModel";

export function ConnectStatusPage() {
  const navigate = useNavigate();
  const model = useConnectStatusPageModel();

  if (model.pageState.status === "empty") {
    return <SessionMissing />;
  }

  return (
    <PageFrame title={model.header.title} className="connect-status-page">
      <PageCardSection title="Confirm connection" description={model.description}>
        <div className="btn-row">
          <MissionPrimaryButton
            onClick={() => model.confirmConnected().then((ok) => ok && navigate("/", { replace: true }))}
            disabled={model.isConfirming}
          >
            {model.isConfirming ? "Confirming…" : "I'm connected"}
          </MissionPrimaryButton>
        </div>
        <div className="btn-row">
          <MissionSecondaryLink to="/devices">Go to devices</MissionSecondaryLink>
        </div>
      </PageCardSection>
    </PageFrame>
  );
}
