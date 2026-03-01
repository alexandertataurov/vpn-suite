import type { TelemetryMode } from "../../domain/telemetry/telemetryTypes";
import { MetricsKpisPanel } from "./MetricsKpisPanel";
import { ScrapeStatusPanel } from "./ScrapeStatusPanel";
import { TraceValidationPanel } from "./TraceValidationPanel";
import { IncidentBanner } from "./IncidentBanner";
import { AlertsPanel } from "./AlertsPanel";
import { SectionLabel } from "@/design-system";
import { useDockerAlerts, useDockerHosts } from "../../hooks/useDockerTelemetry";
import { Card } from "@/design-system";

interface OperatorTelemetryViewProps {
  onModeChange: (mode: TelemetryMode) => void;
}

export function OperatorTelemetryView({
  onModeChange,
}: OperatorTelemetryViewProps) {
  const hostsQuery = useDockerHosts();
  const defaultHostId = hostsQuery.data?.items?.[0]?.host_id ?? "";
  const alertsQuery = useDockerAlerts(defaultHostId);

  return (
    <>
      <IncidentBanner
        onNavigate={(target) => {
          if (target === "containers" || target === "alerts" || target === "services") {
            onModeChange("engineer");
          }
          if (target === "containers" || target === "alerts") {
            const detail = document.getElementById("telemetry-section-detail");
            if (detail) detail.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }}
      />

      <SectionLabel id="telemetry-section-overview">Health &amp; ingestion</SectionLabel>
      <div
        className="operator-grid-cell operator-grid-cell--span-6 operator-card"
        aria-labelledby="telemetry-section-overview"
      >
        <MetricsKpisPanel />
      </div>
      <div
        className="operator-grid-cell operator-grid-cell--span-6 operator-card"
        aria-labelledby="telemetry-section-overview"
      >
        <ScrapeStatusPanel />
      </div>
      <div
        className="operator-grid-cell operator-grid-cell--span-12 operator-card"
        aria-labelledby="telemetry-section-overview"
      >
        <TraceValidationPanel />
      </div>

      <SectionLabel id="telemetry-section-alerts">Alerts</SectionLabel>
      <div
        className="operator-grid-cell operator-grid-cell--span-12 operator-card"
        aria-labelledby="telemetry-section-alerts"
      >
        <Card as="div" variant="outline" aria-label="Alerts preview">
          <AlertsPanel
            items={alertsQuery.data?.items ?? []}
            isLoading={alertsQuery.isLoading}
            error={alertsQuery.error}
          />
        </Card>
      </div>
    </>
  );
}
