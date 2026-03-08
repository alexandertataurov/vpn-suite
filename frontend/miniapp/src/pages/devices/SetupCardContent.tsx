import {
  MissionAlert,
  MissionPrimaryButton,
  MissionPrimaryLink,
  MissionSecondaryLink,
  ButtonRow,
} from "@/design-system";

export type SetupStep = "subscription" | "issue" | "pending";

export interface SetupCardContentProps {
  step: SetupStep;
  onIssueDevice?: () => void;
  canAddDevice?: boolean;
  isAddPending?: boolean;
  issueActionLabel?: string;
  recommendedRoute?: string;
}

/** Reusable setup step content: alert + actions. */
export function SetupCardContent({
  step,
  onIssueDevice,
  canAddDevice = false,
  isAddPending = false,
  issueActionLabel = "Add device",
  recommendedRoute = "/devices",
}: SetupCardContentProps) {
  if (step === "subscription") {
    return (
      <MissionAlert
        tone="info"
        title="No active subscription"
        message="Choose a plan first. You'll return to device setup after payment."
        actions={(
          <ButtonRow>
            <MissionPrimaryLink to="/plan">Choose plan</MissionPrimaryLink>
            <MissionSecondaryLink to="/support">Support</MissionSecondaryLink>
          </ButtonRow>
        )}
      />
    );
  }
  if (step === "issue") {
    return (
      <MissionAlert
        tone="warning"
        title="Issue your first device"
        message="Generate a config here, import in your VPN app, then confirm."
        actions={(
          <ButtonRow>
            <MissionPrimaryButton
              onClick={onIssueDevice}
              disabled={!canAddDevice || isAddPending}
            >
              {isAddPending ? "Issuing…" : issueActionLabel}
            </MissionPrimaryButton>
            <MissionSecondaryLink to="/servers">Routing</MissionSecondaryLink>
          </ButtonRow>
        )}
      />
    );
  }
  return (
    <ButtonRow>
      <MissionPrimaryLink to={recommendedRoute}>Continue setup</MissionPrimaryLink>
      <MissionSecondaryLink to="/support">Troubleshoot</MissionSecondaryLink>
    </ButtonRow>
  );
}
