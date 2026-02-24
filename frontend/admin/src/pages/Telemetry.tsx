import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, RefreshCw } from "lucide-react";
import { PrimitiveBadge, Tabs } from "@vpn-suite/shared/ui";
import { PageHeader } from "../components/PageHeader";
import { DockerServicesTab } from "./telemetry/DockerServicesTab";
import { VpnNodesTab } from "./telemetry/VpnNodesTab";
import { MetricsKpisPanel } from "../components/telemetry/MetricsKpisPanel";
import { ScrapeStatusPanel } from "../components/telemetry/ScrapeStatusPanel";
import {
  ANALYTICS_METRICS_KPIS_KEY,
  ANALYTICS_TELEMETRY_SERVICES_KEY,
  DOCKER_TELEMETRY_KEY,
  OPERATOR_DASHBOARD_KEY,
  SERVERS_LIST_KEY,
  TELEMETRY_TOPOLOGY_KEY,
} from "../api/query-keys";
import { RefreshButton } from "../components/RefreshButton";
import { refreshRegisteredResources } from "../utils/resourceRegistry";

type TelemetryTab = "docker" | "vpn";
const TELEMETRY_TAB_ITEMS = [
  { id: "docker" as const, label: "Docker Services" },
  { id: "vpn" as const, label: "VPN Nodes" },
];

export function TelemetryPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const regionFilter = searchParams.get("region") ?? "all";
  const activeTab: TelemetryTab = searchParams.get("tab") === "vpn" ? "vpn" : "docker";

  const setTab = (tab: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    setSearchParams(next);
  };

  const handleRefreshNow = async () => {
    const [results, registered] = await Promise.all([
      Promise.all([
        queryClient.refetchQueries({ queryKey: ["telemetry"] }),
        queryClient.refetchQueries({ queryKey: DOCKER_TELEMETRY_KEY }),
        queryClient.refetchQueries({ queryKey: OPERATOR_DASHBOARD_KEY }),
        queryClient.refetchQueries({ queryKey: TELEMETRY_TOPOLOGY_KEY }),
        queryClient.refetchQueries({ queryKey: SERVERS_LIST_KEY }),
        queryClient.refetchQueries({ queryKey: ANALYTICS_TELEMETRY_SERVICES_KEY }),
        queryClient.refetchQueries({ queryKey: ANALYTICS_METRICS_KPIS_KEY }),
      ]),
      refreshRegisteredResources(),
    ]);
    const hasResultError = results.some(
      (res) => Array.isArray(res) && res.some((r) => (r as { error?: unknown }).error)
    );
    const hasCacheError = [
      ["telemetry"],
      ANALYTICS_TELEMETRY_SERVICES_KEY,
      ANALYTICS_METRICS_KPIS_KEY,
      DOCKER_TELEMETRY_KEY,
      OPERATOR_DASHBOARD_KEY,
      TELEMETRY_TOPOLOGY_KEY,
      SERVERS_LIST_KEY,
    ].some((key) =>
      queryClient.getQueryCache().findAll({ queryKey: key }).some((q) => q.state.status === "error")
    );
    const hasRegisteredError = registered.some((r) => !r.ok);
    if (hasResultError || hasCacheError || hasRegisteredError) {
      throw new Error("refresh_failed");
    }
  };

  return (
    <div className="ref-page" data-testid="telemetry-page">
      <PageHeader
        icon={BarChart3}
        title="Telemetry"
        description="Docker and VPN node metrics"
      >
        <RefreshButton
          variant="secondary"
          size="sm"
          onRefresh={handleRefreshNow}
          ariaLabel="Refresh telemetry data"
          icon={<RefreshCw className="icon-sm" aria-hidden />}
          idleLabel="Refresh now"
          loadingLabel="Updating…"
          successLabel="Updated just now"
          errorLabel="Update failed"
        />
        {regionFilter !== "all" ? <PrimitiveBadge variant="info">Region: {regionFilter}</PrimitiveBadge> : null}
      </PageHeader>

      <ScrapeStatusPanel />
      <MetricsKpisPanel />

      <Tabs
        items={TELEMETRY_TAB_ITEMS}
        value={activeTab}
        onChange={setTab}
        ariaLabel="Telemetry tabs"
        className="tabs tabs-page"
        tabClassName="tabs-page-item"
        idPrefix="telemetry"
      />

      <div
        id="telemetry-tabpanel-docker"
        role="tabpanel"
        aria-labelledby="telemetry-tab-docker"
        hidden={activeTab !== "docker"}
      >
        {activeTab === "docker" ? <DockerServicesTab /> : null}
      </div>
      <div
        id="telemetry-tabpanel-vpn"
        role="tabpanel"
        aria-labelledby="telemetry-tab-vpn"
        hidden={activeTab !== "vpn"}
      >
        {activeTab === "vpn" ? <VpnNodesTab regionFilter={regionFilter} /> : null}
      </div>
    </div>
  );
}
