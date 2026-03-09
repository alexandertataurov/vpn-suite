import { useNavigate } from "react-router-dom";
import { SessionMissing } from "@/components";
import {
  PageFrame,
  PageCardSection,
  MissionPrimaryButton,
  MissionSecondaryLink,
  ButtonRow,
} from "@/design-system";
import { useConnectStatusPageModel } from "@/page-models";

export function ConnectStatusPage() {
  const navigate = useNavigate();
  const model = useConnectStatusPageModel();

  if (model.pageState.status === "empty") {
    return <SessionMissing />;
  }

  return (
    <PageFrame title={model.header.title} className="connect-status-page">
      <PageCardSection title="Confirm connection" description={model.description}>
        <ButtonRow>
          <MissionPrimaryButton
            onClick={() => model.confirmConnected().then((ok) => ok && navigate("/", { replace: true }))}
            disabled={model.isConfirming}
          >
            {model.isConfirming ? "Confirming…" : "I'm connected"}
          </MissionPrimaryButton>
        </ButtonRow>
        <ButtonRow>
          <MissionSecondaryLink to="/devices">Go to devices</MissionSecondaryLink>
        </ButtonRow>
      </PageCardSection>
    </PageFrame>
  );
}
