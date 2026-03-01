import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ServiceScrapeStatus, TelemetryServicesOut } from "@vpn-suite/shared/types";
import { PrimitiveBadge, InlineAlert, Skeleton, Button, useToast } from "@/design-system";
import { api } from "../../api/client";
import { ANALYTICS_TELEMETRY_SERVICES_KEY } from "../../api/query-keys";
import { getTelemetryErrorMessage } from "../../utils/telemetry-freshness";
import { shouldRetryQuery } from "../../utils/queryPolicy";
import { TelemetrySection } from "./TelemetrySection";

export function ScrapeStatusPanel() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { data, isLoading, isError, error } = useQuery<TelemetryServicesOut>({
    queryKey: ANALYTICS_TELEMETRY_SERVICES_KEY,
    queryFn: ({ signal }) => api.get<TelemetryServicesOut>("/analytics/telemetry/services", { signal }),
    staleTime: 25_000,
    refetchInterval: 30_000,
    retry: shouldRetryQuery,
  });

  const controlMutation = useMutation({
    mutationFn: async (params: { job: string; action: "start" | "stop" | "restart" }) => {
      const { job, action } = params;
      await api.post<void>(
        `/analytics/telemetry/services/${encodeURIComponent(job)}/${encodeURIComponent(action)}`,
        {},
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ANALYTICS_TELEMETRY_SERVICES_KEY });
      addToast("Scrape service control requested", "success");
    },
    onError: (err) => {
      addToast(getTelemetryErrorMessage(err, "Scrape service control failed"), "error");
    },
  });

  if (isLoading) {
    return (
      <TelemetrySection title="Scrape status" ariaLabel="Scrape status">
        <Skeleton className="h-16" />
      </TelemetrySection>
    );
  }

  if (isError || !data) {
    return (
      <TelemetrySection title="Scrape status" ariaLabel="Scrape status">
        <InlineAlert
          variant="error"
          title="Failed to load scrape status"
          message={getTelemetryErrorMessage(error, "Could not load scrape status")}
        />
      </TelemetrySection>
    );
  }

  if (!data.prometheus_available) {
    return (
      <TelemetrySection title="Scrape status" ariaLabel="Scrape status">
        <InlineAlert
          variant="warning"
          title="Prometheus not configured"
          message={data.message ?? "TELEMETRY_PROMETHEUS_URL is unset. Set it when monitoring profile is running."}
        />
      </TelemetrySection>
    );
  }

  const upCount = data.services.filter((s: ServiceScrapeStatus) => s.health === "up").length;
  const downCount = data.services.length - upCount;

  return (
    <TelemetrySection
      title="Scrape status"
      ariaLabel="Scrape status"
      description={
        <span>
          {upCount} up, {downCount} down
        </span>
      }
    >
      <div className="flex flex-wrap gap-2" role="list">
        {data.services.map((s: ServiceScrapeStatus) => {
          const lastScrape = s.last_scrape ? new Date(s.last_scrape).toLocaleString() : "unknown";
          const job = s.job;
          const isUp = s.health === "up";
          return (
            <span key={`${s.job}-${s.instance}`} className="inline-flex items-center gap-2" role="listitem">
              <PrimitiveBadge
                size="sm"
                variant={s.health === "up" ? "success" : "danger"}
                aria-label={`${s.job}: ${s.health}`}
                title={`${s.job} (${s.instance}) · last scrape: ${lastScrape}`}
              >
                {s.job}
              </PrimitiveBadge>
              <div className="inline-flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => controlMutation.mutate({ job, action: "start" })}
                  disabled={controlMutation.isPending || isUp}
                  aria-label={`Start scrape service ${s.job}`}
                >
                  Start
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => controlMutation.mutate({ job, action: "stop" })}
                  disabled={controlMutation.isPending || !isUp}
                  aria-label={`Stop scrape service ${s.job}`}
                >
                  Stop
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => controlMutation.mutate({ job, action: "restart" })}
                  disabled={controlMutation.isPending}
                  aria-label={`Restart scrape service ${s.job}`}
                >
                  Restart
                </Button>
              </div>
            </span>
          );
        })}
      </div>
    </TelemetrySection>
  );
}
