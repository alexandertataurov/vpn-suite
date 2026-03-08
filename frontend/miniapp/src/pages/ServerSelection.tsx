import {
  FallbackScreen,
  Skeleton,
  PageCardSection,
  PageFrame,
  PageSection,
  MissionChip,
  MissionModuleHead,
  MissionProgressBar,
  MissionPrimaryButton,
  MissionSecondaryButton,
  SessionMissing,
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
        <div className="btn-row">
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
        </div>
      </PageCardSection>

      <PageSection
        title="Locations"
        action={<MissionChip tone={model.locationsBadge.tone} className="section-meta-chip miniapp-tnum">{model.locationsBadge.label}</MissionChip>}
        description="Compare location, latency, and load before pinning a preferred route."
      >
        <div className="stack">
          {model.data.items.map((server) => {
            const load = server.load_percent ?? 0;
            const isPending = model.isMutating && model.pendingServerId === server.id;
            const code = (server.region ?? server.name ?? "??").slice(0, 2).toUpperCase();
            return (
              <article key={server.id} className="module-card">
                <MissionModuleHead
                  label={`Node ${code}`}
                  chip={<MissionChip tone={server.is_current ? "green" : "neutral"}>{server.is_current ? "Current" : "Available"}</MissionChip>}
                />
                <div className="data-grid">
                  <div className="data-cell">
                    <div className="dc-key">Location</div>
                    <div className="dc-val teal">{server.name}</div>
                  </div>
                  <div className="data-cell">
                    <div className="dc-key">Latency</div>
                    <div className={`dc-val ${server.avg_ping_ms != null ? "green" : "mut"} miniapp-tnum`}>
                      {server.avg_ping_ms != null ? `${Math.round(server.avg_ping_ms)}ms` : "--"}
                    </div>
                  </div>
                </div>
                <div className="server-load">
                  <div className="module-head">
                    <span className="dc-key">Load</span>
                    <span className="dc-val miniapp-tnum">{Math.round(load)}%</span>
                  </div>
                  <MissionProgressBar
                    percent={load}
                    tone={load >= 85 ? "danger" : load >= 65 ? "warning" : "healthy"}
                    staticFill
                    ariaLabel={`${server.name} load ${Math.round(load)}%`}
                  />
                </div>
                {server.is_current ? (
                  <MissionSecondaryButton onClick={() => model.handleSelectServer(server)} disabled={!model.isOnline || isPending}>
                    {isPending ? "Selecting…" : "Current"}
                  </MissionSecondaryButton>
                ) : (
                  <MissionPrimaryButton onClick={() => model.handleSelectServer(server)} disabled={!model.isOnline || isPending}>
                    {isPending ? "Selecting…" : "Select"}
                  </MissionPrimaryButton>
                )}
              </article>
            );
          })}
        </div>
      </PageSection>
    </PageFrame>
  );
}
