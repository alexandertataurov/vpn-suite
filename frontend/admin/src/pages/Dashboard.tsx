import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, Server, FileText, Activity, Settings, RotateCw } from "lucide-react";
import { Button, ConfirmModal } from "@vpn-suite/shared/ui";
import { ApiError } from "@vpn-suite/shared/types";
import { api } from "../api/client";
import { useDashboardSettings } from "../hooks/useDashboardSettings";
import { useDashboardRefresh } from "../hooks/useDashboardRefresh";
import { useServerListFull } from "../hooks/useServerList";
import { useOperatorStrip } from "../domain/dashboard";
import { error as reportTelemetryError } from "../telemetry";
import { PageHeader } from "../components/PageHeader";
import { DashboardSettings } from "./dashboard/DashboardSettings";
import { OperatorDashboardContent } from "./dashboard/OperatorDashboardContent";
import { RefreshButton } from "../components/RefreshButton";

export function DashboardPage() {
  const [settings, updateSetting] = useDashboardSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resyncConfirmOpen, setResyncConfirmOpen] = useState(false);
  const [resyncLoading, setResyncLoading] = useState(false);
  const { data: serversData } = useServerListFull();
  const { refresh } = useDashboardRefresh();
  const { strip } = useOperatorStrip();

  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const regionOptions = useMemo(() => {
    const unique = new Set<string>();
    for (const s of serversData?.items ?? []) {
      if (s.region) unique.add(s.region);
    }
    return [{ value: "all", label: "All regions" }, ...Array.from(unique).sort().map((r) => ({ value: r, label: r }))];
  }, [serversData?.items]);
  const handleResync = useCallback(async () => {
    setResyncLoading(true);
    try {
      await api.post("/cluster/resync", {});
      handleRefresh();
    } catch (e) {
      if (e instanceof ApiError) reportTelemetryError(e, { route: "/" });
    } finally {
      setResyncLoading(false);
      setResyncConfirmOpen(false);
    }
  }, [handleRefresh]);

  return (
    <div className={`dashboard ref-page dashboard--${settings.density}`} data-testid="dashboard-page">
      <PageHeader title="Dashboard" scopeLabel="Region: All" lastUpdated={strip?.lastUpdated}>
        <Link to="/servers">
          <Button variant="secondary" size="sm" aria-label="View servers">
            <Server className="icon-sm" aria-hidden /> Servers
          </Button>
        </Link>
        <Link to="/audit">
          <Button variant="secondary" size="sm" aria-label="View audit log">
            <FileText className="icon-sm" aria-hidden /> Audit
          </Button>
        </Link>
        <Link to="/telemetry">
          <Button variant="secondary" size="sm" aria-label="Open telemetry">
            <Activity className="icon-sm" aria-hidden /> Telemetry
          </Button>
        </Link>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setResyncConfirmOpen(true)}
          aria-label="Run cluster resync"
        >
          <RotateCw className="icon-sm" aria-hidden /> Resync
        </Button>
        <RefreshButton
          variant="secondary"
          size="sm"
          onRefresh={handleRefresh}
          data-testid="dashboard-refresh"
          ariaLabel="Refresh now"
          icon={<RefreshCw className="icon-sm" aria-hidden />}
          idleLabel="Refresh"
          loadingLabel="Updating…"
          successLabel="Updated just now"
          errorLabel="Update failed"
        />
        <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)} data-testid="dashboard-settings" aria-label="Dashboard settings">
          <Settings className="icon-sm" aria-hidden />
        </Button>
      </PageHeader>

      <OperatorDashboardContent />

      <DashboardSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={updateSetting}
        regionOptions={regionOptions}
      />

      <ConfirmModal
        open={resyncConfirmOpen}
        onClose={() => setResyncConfirmOpen(false)}
        onConfirm={handleResync}
        title="Run cluster resync"
        message="Trigger one reconciliation cycle. This may briefly affect topology."
        confirmLabel="Resync"
        cancelLabel="Cancel"
        loading={resyncLoading}
      />
    </div>
  );
}
