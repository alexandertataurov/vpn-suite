import type { TelemetryMode, TelemetryUrlState } from "../../domain/telemetry/telemetryTypes";
import { MetricsKpisPanel } from "./MetricsKpisPanel";
import { ScrapeStatusPanel } from "./ScrapeStatusPanel";
import { TraceValidationPanel } from "./TraceValidationPanel";
import { TelemetryKpiStrip } from "./TelemetryKpiStrip";
import { IncidentBanner } from "./IncidentBanner";
import { AlertsPanel } from "../../pages/telemetry/AlertsPanel";
import { useDockerAlerts, useDockerHosts } from "../../hooks/useDockerTelemetry";
import { Panel } from "@vpn-suite/shared/ui";

interface OperatorTelemetryViewProps {
  urlState: TelemetryUrlState;
  onModeChange: (mode: TelemetryMode) => void;
}

export function OperatorTelemetryView({
  urlState,
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

      <h2 className="operator-dashboard__section-label" id="telemetry-section-kpis">
        Operator KPIs
      </h2>
      <div
        className="operator-grid-cell operator-grid-cell--span-12 operator-card"
        aria-labelledby="telemetry-section-kpis"
      >
        <TelemetryKpiStrip />
      </div>

      <h2 className="operator-dashboard__section-label" id="telemetry-section-overview">
        Health &amp; ingestion
      </h2>
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

      <h2 className="operator-dashboard__section-label" id="telemetry-section-alerts">
        Alerts
      </h2>
      <div
        className="operator-grid-cell operator-grid-cell--span-12 operator-card"
        aria-labelledby="telemetry-section-alerts"
      >
        <Panel as="div" variant="outline" aria-label="Alerts preview">
          <AlertsPanel
            items={alertsQuery.data?.items ?? []}
            isLoading={alertsQuery.isLoading}
            error={alertsQuery.error}
          />
        </Panel>
      </div>
    </>
  );
}

