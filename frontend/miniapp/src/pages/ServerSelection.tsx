import { SessionMissing } from "@/components";
import {
  FallbackScreen,
  Skeleton,
  PageCardSection,
  PageFrame,
  PageSection,
  PageHeaderBadge,
  MissionPrimaryButton,
  MissionSecondaryButton,
  ServerCard,
  EmptyStateBlock,
} from "@/design-system";
import { useServerSelectionPageModel } from "@/page-models";
import { useI18n } from "@/hooks/useI18n";

export function ServerSelectionPage() {
  const model = useServerSelectionPageModel();
  const { t } = useI18n();

  if (model.pageState.status === "empty") {
    return <SessionMissing message={t("servers.session_missing_message")} />;
  }

  if (model.pageState.status === "error") {
    return (
      <FallbackScreen
        title={model.pageState.title ?? t("common.could_not_load_title")}
        message={model.pageState.message ?? t("common.could_not_load_generic")}
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
    <PageFrame title={model.header.title} subtitle={model.header.subtitle} className="server-selection-page">
      <PageCardSection
        title={t("servers.routing_mode_title")}
        description={t("servers.routing_mode_description")}
        action={
          <PageHeaderBadge
            tone={model.data.auto_select ? "success" : "info"}
            label={model.data.auto_select ? t("servers.routing_status_auto") : t("servers.routing_status_manual")}
          />
        }
      >
        <p className="type-body-sm muted server-selection-note">
          {t("servers.routing_latency_note")}
        </p>
        <div className="miniapp-compact-actions server-selection-page__routing-actions">
          {model.data.auto_select ? (
            <MissionSecondaryButton
              onClick={model.handleAutoSelect}
              disabled={!model.isOnline || (model.isMutating && model.pendingServerId === "auto")}
              className="miniapp-compact-action"
            >
              {model.isMutating && model.pendingServerId === "auto"
                ? t("servers.saving")
                : t("servers.use_best_location")}
            </MissionSecondaryButton>
          ) : (
            <MissionPrimaryButton
              onClick={model.handleAutoSelect}
              disabled={!model.isOnline || (model.isMutating && model.pendingServerId === "auto")}
              className="miniapp-compact-action"
            >
              {model.isMutating && model.pendingServerId === "auto"
                ? t("servers.saving")
                : t("servers.use_best_location")}
            </MissionPrimaryButton>
          )}
        </div>
      </PageCardSection>

      <PageSection
        title={t("servers.locations_title")}
        description={t("servers.locations_description")}
        action={<PageHeaderBadge tone="neutral" label={model.locationsBadge.label} />}
      >
        <div className="stack">
          {model.data.items.length === 0 ? (
            <EmptyStateBlock
              title={t("servers.empty_title")}
              message={t("servers.empty_message")}
            />
          ) : (
            model.data.items.map((server) => (
              <ServerCard
                key={server.id}
                id={server.id}
                name={server.name}
                region={server.region}
                avgPingMs={server.avg_ping_ms}
                loadPercent={server.load_percent ?? null}
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
