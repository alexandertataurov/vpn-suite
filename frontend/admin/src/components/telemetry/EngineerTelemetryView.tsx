import type { TelemetryTab, TelemetryUrlState } from "../../domain/telemetry/telemetryTypes";
import { SectionLabel } from "@/design-system";
import { Tabs } from "@/design-system";
import { DockerServicesTab } from "./DockerServicesTab";
import { VpnNodesTab } from "./VpnNodesTab";

interface EngineerTelemetryViewProps {
  urlState: TelemetryUrlState;
  activeTab: TelemetryTab;
  onTabChange: (tab: TelemetryTab) => void;
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
      <SectionLabel id="telemetry-section-detail">Workloads &amp; VPN nodes</SectionLabel>
      <div
        className="operator-grid-cell operator-grid-cell--span-12 operator-card"
        aria-labelledby="telemetry-section-detail"
      >
        <Tabs
          items={TELEMETRY_TAB_ITEMS}
          value={activeTab}
          onChange={(id) => onTabChange(id as TelemetryTab)}
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
