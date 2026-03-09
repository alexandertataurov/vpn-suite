import { SessionMissing } from "@/components";
import {
  PageFrame,
  PageSection,
  MissionPrimaryButton,
  MissionSecondaryLink,
  ButtonRow,
  StickyBottomBar,
} from "@/design-system";
import { useRestoreAccessPageModel } from "@/page-models";

export function RestoreAccessPage() {
  const model = useRestoreAccessPageModel();

  if (model.pageState.status === "empty") {
    return <SessionMissing />;
  }

  return (
    <PageFrame title={model.header.title} className="restore-access-page">
      <PageSection title="Restore access" description={model.description}>
        <div />
      </PageSection>
      <StickyBottomBar>
        <ButtonRow>
          <MissionPrimaryButton
            onClick={() => model.restoreAccess()}
            disabled={model.isRestoring}
          >
            {model.isRestoring ? "Restoring…" : "Restore access"}
          </MissionPrimaryButton>
          <MissionSecondaryLink to="/plan">View plans</MissionSecondaryLink>
        </ButtonRow>
      </StickyBottomBar>
    </PageFrame>
  );
}
