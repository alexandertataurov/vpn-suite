import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutGrid,
  RefreshCw,
  Server,
  FileText,
  Activity,
  Settings,
  RotateCw,
} from "lucide-react";
import { Button, ConfirmModal } from "@vpn-suite/shared/ui";
import { ApiError } from "@vpn-suite/shared/types";
import { api } from "../api/client";
import { AUDIT_KEY, CONNECTION_NODES_KEY, OPERATOR_DASHBOARD_KEY, PEERS_LIST_KEY, SERVERS_LIST_DASHBOARD_KEY } from "../api/query-keys";
import { useDashboardSettings } from "../hooks/useDashboardSettings";
import { useServerListFull } from "../hooks/useServerList";
import { logFrontendError } from "../utils/logFrontendError";
import { PageHeader } from "../components/PageHeader";
import { DashboardSettings } from "./dashboard/DashboardSettings";
import { OperatorDashboardContent } from "./dashboard/OperatorDashboardContent";
import { RefreshButton } from "../components/RefreshButton";
import { refreshRegisteredResources } from "../utils/resourceRegistry";

export function DashboardPage() {
  const queryClient = useQueryClient();
  const [settings, updateSetting] = useDashboardSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resyncConfirmOpen, setResyncConfirmOpen] = useState(false);
  const [resyncLoading, setResyncLoading] = useState(false);
  const { data: serversData } = useServerListFull();

  const handleRefresh = useCallback(async () => {
    const [results, registered] = await Promise.all([
      Promise.all([
        queryClient.refetchQueries({ queryKey: OPERATOR_DASHBOARD_KEY }),
        queryClient.refetchQueries({ queryKey: PEERS_LIST_KEY }),
        queryClient.refetchQueries({ queryKey: CONNECTION_NODES_KEY }),
        queryClient.refetchQueries({ queryKey: AUDIT_KEY }),
        queryClient.refetchQueries({ queryKey: SERVERS_LIST_DASHBOARD_KEY }),
      ]),
      refreshRegisteredResources(),
    ]);
    const hasResultError = results.some(
      (res) => Array.isArray(res) && res.some((r) => (r as { error?: unknown }).error)
    );
    const hasCacheError = [
      OPERATOR_DASHBOARD_KEY,
      PEERS_LIST_KEY,
      CONNECTION_NODES_KEY,
      AUDIT_KEY,
      SERVERS_LIST_DASHBOARD_KEY,
    ].some((key) =>
      queryClient.getQueryCache().findAll({ queryKey: key }).some((q) => q.state.status === "error")
    );
    const hasRegisteredError = registered.some((r) => !r.ok);
    if (hasResultError || hasCacheError || hasRegisteredError) {
      throw new Error("refresh_failed");
    }
  }, [queryClient]);

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
      if (e instanceof ApiError) logFrontendError({ message: e.message, route: "/", widgetId: "resync", statusCode: e.statusCode });
    } finally {
      setResyncLoading(false);
      setResyncConfirmOpen(false);
    }
  }, [handleRefresh]);

  return (
    <div className={`dashboard ref-page dashboard--${settings.density}`} data-testid="dashboard-page">
      <PageHeader icon={LayoutGrid} title="Dashboard">
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
