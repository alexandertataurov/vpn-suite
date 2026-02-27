import { useSearchParams } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { Button, Tabs } from "@vpn-suite/shared/ui";
import { PageHeader } from "../components/PageHeader";
import { useTelemetryContext } from "../context/TelemetryContext";
import { track } from "../telemetry";
import { RefreshButton } from "../components/RefreshButton";
import { parseTelemetryUrlState, updateTelemetryUrlState } from "../domain/telemetry/urlState";
import type { TelemetryMode, TelemetryTab } from "../domain/telemetry/telemetryTypes";
import { OperatorTelemetryView } from "../components/telemetry/OperatorTelemetryView";
import { EngineerTelemetryView } from "../components/telemetry/EngineerTelemetryView";

const TELEMETRY_TAB_ITEMS = [
  { id: "docker" as const, label: "Docker Services" },
  { id: "vpn" as const, label: "VPN Nodes" },
];

export function TelemetryPage() {
  const { refetchAllTelemetry } = useTelemetryContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlState = parseTelemetryUrlState(searchParams);
  const regionFilter = urlState.region;
  const activeTab: TelemetryTab = searchParams.get("tab") === "vpn" ? "vpn" : "docker";

  const setTab = (tab: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    setSearchParams(next);
  };

  const setMode = (mode: TelemetryMode) => {
    const next = updateTelemetryUrlState(searchParams, { mode });
    setSearchParams(next);
  };

  const handleRefreshNow = async () => {
    try {
      track("user_action", { action_type: "telemetry_refresh", target_page: "/telemetry" });
    } catch {
      /* noop */
    }
    await refetchAllTelemetry();
  };

  return (
    <div className="dashboard ref-page dashboard--comfortable telemetry-page" data-testid="telemetry-page">
      <PageHeader
        title="Telemetry"
        scopeLabel={regionFilter === "all" ? "Region: All" : `Region: ${regionFilter}`}
      >
        <div className="flex items-center gap-2">
          <Button
            variant={urlState.mode === "operator" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMode("operator")}
            aria-pressed={urlState.mode === "operator"}
          >
            Operator
          </Button>
          <Button
            variant={urlState.mode === "engineer" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMode("engineer")}
            aria-pressed={urlState.mode === "engineer"}
          >
            Engineer
          </Button>
        </div>
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
      </PageHeader>

      <div className="operator-dashboard telemetry-dashboard" aria-label="Telemetry overview and details">
        {urlState.mode === "operator" ? (
          <OperatorTelemetryView
            urlState={urlState}
            activeTab={activeTab}
            onTabChange={setTab}
            onModeChange={setMode}
          />
        ) : (
          <EngineerTelemetryView
            urlState={urlState}
            activeTab={activeTab}
            onTabChange={setTab}
            onModeChange={setMode}
          />
        )}
      </div>
    </div>
  );
}
