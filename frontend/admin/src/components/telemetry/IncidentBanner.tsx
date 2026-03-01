import { useMemo } from "react";
import { Button } from "@/design-system";
import { useDockerHosts } from "../../hooks/useDockerTelemetry";
import { useTelemetryServices } from "../../domain/telemetry/hooks/useMetricsTelemetry";
import { useTelemetrySnapshotMeta } from "../../domain/telemetry/hooks/useSnapshotTelemetry";

export interface IncidentBannerProps {
  onNavigate?: (target: "containers" | "services" | "alerts" | "ingest") => void;
}

export function IncidentBanner({ onNavigate }: IncidentBannerProps) {
  const hostsQuery = useDockerHosts();
  const servicesQuery = useTelemetryServices();
  const snapshotQuery = useTelemetrySnapshotMeta();

  const unhealthyContainers = useMemo(() => {
    const items = hostsQuery.data?.items ?? [];
    return items.reduce(
      (acc, h) => acc + (h.unhealthy ?? 0) + (h.restart_loops ?? 0),
      0
    );
  }, [hostsQuery.data?.items]);

  const servicesDown = useMemo(() => {
    const services = servicesQuery.data?.services ?? [];
    const down = services.filter((s) => s.health !== "up");
    return {
      count: down.length,
      topNames: down.slice(0, 2).map((s) => s.job),
    };
  }, [servicesQuery.data?.services]);

  const activeAlerts = snapshotQuery.data?.meta.incidents_count ?? 0;

  const ingestDelayMinutes = useMemo(() => {
    const ts = snapshotQuery.data?.meta.snapshot_ts;
    if (!ts) return null;
    const ageMs = Date.now() - ts * 1000;
    if (ageMs <= 0) return 0;
    return Math.round(ageMs / 60000);
  }, [snapshotQuery.data?.meta.snapshot_ts]);

  const showBanner =
    unhealthyContainers > 0 ||
    servicesDown.count > 0 ||
    activeAlerts > 0 ||
    (ingestDelayMinutes != null && ingestDelayMinutes > 2);

  if (!showBanner) return null;

  return (
    <div
      className="operator-degraded-banner telemetry-incident-banner"
      role="region"
      aria-label="Telemetry incidents"
    >
      {unhealthyContainers > 0 && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onNavigate?.("containers")}
          aria-label={`${unhealthyContainers} unhealthy containers, open Docker view`}
        >
          {unhealthyContainers.toLocaleString()} unhealthy containers
        </Button>
      )}
      {servicesDown.count > 0 && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onNavigate?.("services")}
          aria-label={`${servicesDown.count} telemetry services down, open scrape status`}
        >
          {servicesDown.count} services down
          {servicesDown.topNames.length ? ` (${servicesDown.topNames.join(", ")}${servicesDown.count > servicesDown.topNames.length ? ", …" : ""})` : ""}
        </Button>
      )}
      {activeAlerts > 0 && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onNavigate?.("alerts")}
          aria-label={`${activeAlerts} active alerts, open alerts view`}
        >
          {activeAlerts} active alerts
        </Button>
      )}
      {ingestDelayMinutes != null && ingestDelayMinutes > 2 && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onNavigate?.("ingest")}
          aria-label={`Telemetry ingest delayed by ${ingestDelayMinutes} minutes`}
        >
          Ingest delayed by {ingestDelayMinutes}m
        </Button>
      )}
    </div>
  );
}

