import { useNavigate } from "react-router-dom";
import { SessionMissing } from "@/components";
import {
  ActionCard,
  FallbackScreen,
  Skeleton,
  SkeletonList,
  Button,
  PageSection,
  ServerCard,
  EmptyStateBlock,
  PageScaffold,
  ModernHeader,
} from "@/design-system";
import { useServerSelectionPageModel } from "@/page-models";
import { useI18n } from "@/hooks";

export function ServerSelectionPage() {
  const navigate = useNavigate();
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
      <PageScaffold>
        <ModernHeader
          title={model.header.title || t("servers.header_title")}
          showSettings={false}
          onBack={() => navigate(-1)}
        />
        <div className="modern-content-pad stagger-1">
          <Skeleton variant="card" height={160} />
          <div className="u-mt-24 u-mb-8">
            <Skeleton variant="line" width="40%" />
          </div>
          <SkeletonList lines={6} />
        </div>
      </PageScaffold>
    );
  }

  return (
    <PageScaffold>
      <ModernHeader
        title={model.header.title}
        subtitle={model.header.subtitle}
        showSettings={false}
        onBack={() => navigate(-1)}
      />
      <div className="modern-content-pad">
        <ActionCard
          title={t("servers.routing_mode_title")}
          description={t("servers.routing_mode_description")}
          className="modern-m-0"
        >
          <p className="type-body-sm muted u-mt-12">
            {t("servers.routing_latency_note")}
          </p>
          <div className="u-mt-16">
            <Button
              variant={model.data.auto_select ? "secondary" : "primary"}
              onClick={model.handleAutoSelect}
              status={model.isMutating && model.pendingServerId === "auto" ? "loading" : "idle"}
              statusText={t("servers.saving")}
              disabled={!model.isOnline || (model.isMutating && model.pendingServerId === "auto")}
              fullWidth
            >
              {t("servers.use_best_location")}
            </Button>
          </div>
        </ActionCard>
      </div>

      <PageSection
        title={t("servers.locations_title")}
        description={t("servers.locations_description")}
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
    </PageScaffold>
  );
}
