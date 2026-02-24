import { useQuery } from "@tanstack/react-query";
import { Panel, PrimitiveBadge, InlineAlert, Skeleton } from "@vpn-suite/shared/ui";
import { api } from "../../api/client";
import { ANALYTICS_TELEMETRY_SERVICES_KEY } from "../../api/query-keys";
import { shouldRetryQuery } from "../../utils/queryPolicy";

interface ServiceScrapeStatus {
  job: string;
  instance: string;
  health: string;
  last_scrape: string | null;
  last_error: string | null;
}

interface TelemetryServicesOut {
  services: ServiceScrapeStatus[];
  prometheus_available: boolean;
  message?: string | null;
}

export function ScrapeStatusPanel() {
  const { data, isLoading, isError, error } = useQuery<TelemetryServicesOut>({
    queryKey: ANALYTICS_TELEMETRY_SERVICES_KEY,
    queryFn: ({ signal }) => api.get<TelemetryServicesOut>("/analytics/telemetry/services", { signal }),
    staleTime: 25_000,
    refetchInterval: 30_000,
    retry: shouldRetryQuery,
  });

  if (isLoading) {
    return (
      <Panel as="section" variant="outline" aria-label="Scrape status">
        <h3 className="ref-settings-title">Scrape status</h3>
        <Skeleton className="h-16" />
      </Panel>
    );
  }

  if (isError || !data) {
    return (
      <Panel as="section" variant="outline" aria-label="Scrape status">
        <h3 className="ref-settings-title">Scrape status</h3>
        <InlineAlert variant="error" title="Failed to load scrape status">
          {error instanceof Error ? error.message : "Unknown error"}
        </InlineAlert>
      </Panel>
    );
  }

  if (!data.prometheus_available) {
    return (
      <Panel as="section" variant="outline" aria-label="Scrape status">
        <h3 className="ref-settings-title">Scrape status</h3>
        <InlineAlert variant="warning" title="Prometheus not configured">
          {data.message ?? "TELEMETRY_PROMETHEUS_URL is unset. Set it when monitoring profile is running."}
        </InlineAlert>
      </Panel>
    );
  }

  const upCount = data.services.filter((s) => s.health === "up").length;
  const downCount = data.services.length - upCount;

  return (
    <Panel as="section" variant="outline" aria-label="Scrape status">
      <h3 className="ref-settings-title">Scrape status</h3>
      <p className="text-sm text-muted mb-2">
        {upCount} up, {downCount} down
      </p>
      <div className="flex flex-wrap gap-2" role="list">
        {data.services.map((s) => (
          <span key={`${s.job}-${s.instance}`} className="inline-flex items-center gap-1" role="listitem">
            <PrimitiveBadge
              size="sm"
              variant={s.health === "up" ? "success" : "danger"}
              aria-label={`${s.job}: ${s.health}`}
            >
              {s.job}
            </PrimitiveBadge>
          </span>
        ))}
      </div>
    </Panel>
  );
}
