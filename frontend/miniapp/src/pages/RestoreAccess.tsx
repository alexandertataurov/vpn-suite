import { PageFrame, PageCardSection, MissionPrimaryButton, MissionSecondaryLink, SessionMissing } from "@/design-system";
import { useRestoreAccessPageModel } from "@/page-models/useRestoreAccessPageModel";

export function RestoreAccessPage() {
  const model = useRestoreAccessPageModel();

  if (model.pageState.status === "empty") {
    return <SessionMissing />;
  }

  return (
    <PageFrame title={model.header.title} className="restore-access-page">
      <PageCardSection title="Restore access" description={model.description}>
        <div className="btn-row">
          <MissionPrimaryButton
            onClick={() => model.restoreAccess()}
            disabled={model.isRestoring}
          >
            {model.isRestoring ? "Restoring…" : "Restore access"}
          </MissionPrimaryButton>
        </div>
        <div className="btn-row">
          <MissionSecondaryLink to="/plan">View plans</MissionSecondaryLink>
        </div>
      </PageCardSection>
    </PageFrame>
  );
}
