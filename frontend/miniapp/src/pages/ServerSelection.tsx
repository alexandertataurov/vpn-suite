import { SessionMissing } from "@/components";
import {
  FallbackScreen,
  Skeleton,
  PageCardSection,
  PageFrame,
  PageSection,
  MissionChip,
  MissionPrimaryButton,
  MissionSecondaryButton,
  ButtonRow,
  ServerCard,
  EmptyStateBlock,
} from "@/design-system";
import { useServerSelectionPageModel } from "@/page-models";

export function ServerSelectionPage() {
  const model = useServerSelectionPageModel();

  if (model.pageState.status === "empty") {
    return <SessionMissing message="Your Telegram session is not active. Close and reopen the mini app from the bot." />;
  }

  if (model.pageState.status === "error") {
    return (
      <FallbackScreen
        title={model.pageState.title ?? "Could not load servers"}
        message={model.pageState.message ?? "We could not load server list. Please try again later."}
        onRetry={model.pageState.onRetry}
      />
    );
  }

  if (model.pageState.status === "loading" || !model.data) {
    return (
      <PageFrame title={model.header.title} className="server-selection-page">
        <Skeleton className="skeleton-h-lg" />
        <Skeleton className="skeleton-h-hero" />
      </PageFrame>
    );
  }

  return (
    <PageFrame title={model.header.title} className="server-selection-page">
      <PageCardSection title="Routing mode" description="Use automatic routing or lock a preferred location.">
        <p className="op-desc type-body-sm">
          {model.data.auto_select ? "Automatic server selection is enabled." : "Manual server preference is enabled."}
        </p>
        <p className="op-desc type-body-sm">We prioritize healthy, low-load servers near your region.</p>
        <ButtonRow>
          {model.data.auto_select ? (
            <MissionSecondaryButton
              onClick={model.handleAutoSelect}
              disabled={!model.isOnline || (model.isMutating && model.pendingServerId === "auto")}
            >
              {model.isMutating && model.pendingServerId === "auto" ? "Applying…" : "Use best server"}
            </MissionSecondaryButton>
          ) : (
            <MissionPrimaryButton
              onClick={model.handleAutoSelect}
              disabled={!model.isOnline || (model.isMutating && model.pendingServerId === "auto")}
            >
              {model.isMutating && model.pendingServerId === "auto" ? "Applying…" : "Use best server"}
            </MissionPrimaryButton>
          )}
        </ButtonRow>
      </PageCardSection>

      <PageSection
        title="Locations"
        action={<MissionChip tone={model.locationsBadge.tone} className="section-meta-chip miniapp-tnum">{model.locationsBadge.label}</MissionChip>}
        description="Compare location, latency, and load before pinning a preferred route."
      >
        <div className="stack">
          {model.data.items.length === 0 ? (
            <EmptyStateBlock
              title="No servers available"
              message="Server list is empty. Try again later or contact support."
            />
          ) : (
            model.data.items.map((server) => (
              <ServerCard
                key={server.id}
                id={server.id}
                name={server.name}
                region={server.region}
                avgPingMs={server.avg_ping_ms}
                loadPercent={server.load_percent ?? 0}
                isCurrent={server.is_current}
                isPending={model.isMutating && model.pendingServerId === server.id}
                onSelect={() => model.handleSelectServer(server)}
                disabled={!model.isOnline}
              />
            ))
          )}
        </div>
      </PageSection>
    </PageFrame>
  );
}
