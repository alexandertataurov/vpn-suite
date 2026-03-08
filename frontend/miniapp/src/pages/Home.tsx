import {
  FallbackScreen,
  PageFrame,
  PageSection,
  Skeleton,
  MissionChip,
  ConnectionStatusHero,
  HomeQuickActionGrid,
  SessionMissing,
  HomePrimaryActionZone,
} from "@/design-system";
import { useHomePageModel } from "@/page-models";

export function HomePage() {
  const model = useHomePageModel();

  if (model.pageState.status === "empty") {
    return <SessionMissing />;
  }

  if (model.pageState.status === "error") {
    return (
      <FallbackScreen
        title={model.pageState.title ?? "Could not load account status"}
        message={model.pageState.message ?? "Could not load account status"}
        onRetry={model.pageState.onRetry}
      />
    );
  }

  if (model.pageState.status === "loading") {
    return (
      <PageFrame title={model.header.title} className="home-page">
        <PageSection title="Quick Access" className="stagger-1">
          <Skeleton variant="card" className="stagger-2" />
        </PageSection>
      </PageFrame>
    );
  }

  return (
    <PageFrame title={model.header.title} className="home-page">
      <ConnectionStatusHero {...model.connectionHero} />
      {!model.hasSubscription ? (
        <div className="stagger-2">
          <HomePrimaryActionZone
            phase="inactive"
            primaryTo="/plan"
            primaryLabel="Get a plan"
            secondaryLabel="Learn support flow"
            secondaryTo="/support"
          />
        </div>
      ) : null}
      <PageSection
        title="Quick Access"
        action={(
          <MissionChip
            tone={model.quickAccessMeta.badge.tone}
            className={`section-meta-chip ${model.quickAccessMeta.badge.emphasizeNumeric ? "miniapp-tnum" : ""}`.trim()}
          >
            {model.quickAccessMeta.badge.label}
          </MissionChip>
        )}
        description={model.quickAccessMeta.description}
        className="stagger-2"
      >
        <HomeQuickActionGrid hasSub={model.hasSubscription} />
      </PageSection>
    </PageFrame>
  );
}
