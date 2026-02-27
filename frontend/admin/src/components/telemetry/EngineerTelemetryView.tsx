import type { TelemetryMode, TelemetryUrlState } from "../../domain/telemetry/telemetryTypes";
import type { TelemetryTab } from "../../pages/Telemetry";
import { Tabs } from "@vpn-suite/shared/ui";
import { DockerServicesTab } from "../../pages/telemetry/DockerServicesTab";
import { VpnNodesTab } from "../../pages/telemetry/VpnNodesTab";

interface EngineerTelemetryViewProps {
  urlState: TelemetryUrlState;
  activeTab: TelemetryTab;
  onTabChange: (tab: TelemetryTab) => void;
  onModeChange: (mode: TelemetryMode) => void;
}

const TELEMETRY_TAB_ITEMS = [
  { id: "docker" as const, label: "Docker Services" },
  { id: "vpn" as const, label: "VPN Nodes" },
];

export function EngineerTelemetryView({
  urlState,
  activeTab,
  onTabChange,
}: EngineerTelemetryViewProps) {
  return (
    <>
      <h2 className="operator-dashboard__section-label" id="telemetry-section-detail">
        Workloads &amp; VPN nodes
      </h2>
      <div
        className="operator-grid-cell operator-grid-cell--span-12 operator-card"
        aria-labelledby="telemetry-section-detail"
      >
        <Tabs
          items={TELEMETRY_TAB_ITEMS}
          value={activeTab}
          onChange={onTabChange}
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
          {activeTab === "vpn" ? <VpnNodesTab regionFilter={urlState.region} /> : null}
        </div>
      </div>
    </>
  );
}

