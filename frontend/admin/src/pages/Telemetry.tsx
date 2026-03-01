import { useSearchParams } from "react-router-dom";
import { IconRefresh } from "@/design-system/icons";
import { Button } from "@/design-system";
import { DashboardPage } from "../templates/DashboardPage";
import { useTelemetryContext } from "../context/TelemetryContext";
import { track } from "../telemetry";
import { RefreshButton } from "@/components";
import { parseTelemetryUrlState, updateTelemetryUrlState } from "../domain/telemetry/urlState";
import type { TelemetryMode, TelemetryTab } from "../domain/telemetry/telemetryTypes";
import { OperatorTelemetryView, EngineerTelemetryView } from "@/components";

export function TelemetryPage() {
  const { refetchAllTelemetry } = useTelemetryContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlState = parseTelemetryUrlState(searchParams);
  const regionFilter = urlState.region;
  const activeTab: TelemetryTab = searchParams.get("tab") === "vpn" ? "vpn" : "docker";

  const setTab = (tab: TelemetryTab) => {
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

  const description = regionFilter === "all" ? "Region: All" : `Region: ${regionFilter}`;
  return (
    <DashboardPage className="dashboard ref-page dashboard--comfortable telemetry-page" data-testid="telemetry-page" title="TELEMETRY" description={description}         primaryAction={
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
          <RefreshButton
          variant="secondary"
          size="sm"
          onRefresh={handleRefreshNow}
          ariaLabel="Refresh telemetry data"
          icon={<IconRefresh className="icon-sm" aria-hidden strokeWidth={1.5} />}
          idleLabel="Refresh now"
          loadingLabel="Updating…"
          successLabel="Updated just now"
          errorLabel="Update failed"
          />
        </div>
      }>
      <div className="operator-dashboard telemetry-dashboard" aria-label="Telemetry overview and details">
        {urlState.mode === "operator" ? (
          <OperatorTelemetryView onModeChange={setMode} />
        ) : (
          <EngineerTelemetryView
            urlState={urlState}
            activeTab={activeTab}
            onTabChange={setTab}
          />
        )}
      </div>
    </DashboardPage>
  );
}
