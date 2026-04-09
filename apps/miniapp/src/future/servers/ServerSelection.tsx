import { useNavigate } from "react-router-dom";
import { SessionMissing } from "@/components";
import {
  ActionCard,
  Skeleton,
  SkeletonList,
  Button,
  PageSection,
  ServerCard,
  EmptyStateBlock,
  PageScaffold,
  PageHeader,
} from "@/design-system";
import { Stack } from "@/design-system/core/primitives";
import { FallbackScreen } from "@/design-system/patterns/FallbackScreen";
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
        <PageHeader
          title={model.header.title || t("servers.header_title")}
          subtitle={model.header.subtitle}
          onBack={() => navigate(-1)}
          backAriaLabel={t("common.back_aria")}
        />
        <Stack gap="4">
          <Skeleton variant="card" height={160} />
          <Skeleton variant="line" width="40%" />
          <SkeletonList lines={6} />
        </Stack>
      </PageScaffold>
    );
  }

  return (
    <PageScaffold>
      <PageHeader
        title={model.header.title}
        subtitle={model.header.subtitle}
        onBack={() => navigate(-1)}
        backAriaLabel={t("common.back_aria")}
      />
      <Stack gap="4">
        <ActionCard
          title={t("servers.routing_mode_title")}
          description={t("servers.routing_mode_description")}
        >
          <Stack gap="4">
            <p className="type-body-sm muted">
              {t("servers.routing_latency_note")}
            </p>
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
          </Stack>
        </ActionCard>
      </Stack>

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
