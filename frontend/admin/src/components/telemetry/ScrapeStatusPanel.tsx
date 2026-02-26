import { useQuery } from "@tanstack/react-query";
import type { ServiceScrapeStatus, TelemetryServicesOut } from "@vpn-suite/shared/types";
import { Panel, PrimitiveBadge, InlineAlert, Skeleton } from "@vpn-suite/shared/ui";
import { api } from "../../api/client";
import { ANALYTICS_TELEMETRY_SERVICES_KEY } from "../../api/query-keys";
import { shouldRetryQuery } from "../../utils/queryPolicy";

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
        <InlineAlert variant="error" title="Failed to load scrape status" message={error instanceof Error ? error.message : "Unknown error"} />
      </Panel>
    );
  }

  if (!data.prometheus_available) {
    return (
      <Panel as="section" variant="outline" aria-label="Scrape status">
        <h3 className="ref-settings-title">Scrape status</h3>
        <InlineAlert
          variant="warning"
          title="Prometheus not configured"
          message={data.message ?? "TELEMETRY_PROMETHEUS_URL is unset. Set it when monitoring profile is running."}
        />
      </Panel>
    );
  }

  const upCount = data.services.filter((s: ServiceScrapeStatus) => s.health === "up").length;
  const downCount = data.services.length - upCount;

  return (
    <Panel as="section" variant="outline" aria-label="Scrape status">
      <h3 className="ref-settings-title">Scrape status</h3>
      <p className="text-sm text-muted mb-2">
        {upCount} up, {downCount} down
      </p>
      <div className="flex flex-wrap gap-2" role="list">
        {data.services.map((s: ServiceScrapeStatus) => {
          const lastScrape = s.last_scrape ? new Date(s.last_scrape).toLocaleString() : "unknown";
          return (
            <span key={`${s.job}-${s.instance}`} className="inline-flex items-center gap-1" role="listitem">
              <PrimitiveBadge
                size="sm"
                variant={s.health === "up" ? "success" : "danger"}
                aria-label={`${s.job}: ${s.health}`}
                title={`${s.job} (${s.instance}) · last scrape: ${lastScrape}`}
              >
                {s.job}
              </PrimitiveBadge>
            </span>
          );
        })}
      </div>
    </Panel>
  );
}
