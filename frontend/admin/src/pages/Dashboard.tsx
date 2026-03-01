import { useState, useMemo, useCallback } from "react";
import { NavLink } from "react-router-dom";
import {
  IconRefresh,
  IconServer,
  IconAuditLog,
  IconTelemetry,
  IconSettings,
  IconResync,
} from "@/design-system/icons";
import { Button, ConfirmModal } from "@/design-system";
import { ApiError } from "@vpn-suite/shared/types";
import { api } from "../api/client";
import { useDashboardSettings } from "../hooks/useDashboardSettings";
import { useDashboardRefresh } from "../hooks/useDashboardRefresh";
import { useServerListFull } from "../hooks/useServerList";
import { useOperatorStrip } from "../domain/dashboard";
import { error as reportTelemetryError } from "../telemetry";
import { RelativeTime } from "@/design-system";
import { DashboardPage as DashboardPageTemplate } from "../templates/DashboardPage";
import { RevenueStrip, SubscriptionHealthStrip, ReferralStrip } from "@/components";
import { AlertsPanel } from "@/components";
import { DashboardSettings } from "./dashboard/DashboardSettings";
import { OperatorDashboardContent } from "./dashboard/OperatorDashboardContent";
import { RefreshButton } from "@/components";

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

  const description = strip?.lastUpdated
    ? (
        <>
          Region: All • Updated <RelativeTime date={strip.lastUpdated} updateInterval={1000} title={strip.lastUpdated} />
        </>
      )
    : "Region: All";

  const healthStatus = strip?.apiStatus === "down" ? "error" : strip?.apiStatus === "degraded" ? "degraded" : "healthy";
  const titleBadge = (
    <span className={`command-bar-status-badge command-bar-status-badge--${healthStatus}`} role="status">
      <span className="command-bar-status-badge-dot" aria-hidden />
      {healthStatus === "healthy" ? "HEALTHY" : healthStatus === "degraded" ? "DEGRADED" : "ERROR"}
    </span>
  );

  return (
    <DashboardPageTemplate className={`dashboard ref-page dashboard--${settings.density}`} data-testid="dashboard-page" title="OVERVIEW" titleBadge={titleBadge} description={description} primaryAction={
        <>
        <NavLink to="/servers" className={({ isActive }) => `command-bar-tab${isActive ? " command-bar-tab--active" : ""}`} aria-label="View servers">
          <IconServer className="icon-sm" aria-hidden strokeWidth={1.5} /> Servers
        </NavLink>
        <NavLink to="/audit" className={({ isActive }) => `command-bar-tab${isActive ? " command-bar-tab--active" : ""}`} aria-label="View audit log">
          <IconAuditLog className="icon-sm" aria-hidden strokeWidth={1.5} /> Audit
        </NavLink>
        <NavLink to="/telemetry" className={({ isActive }) => `command-bar-tab${isActive ? " command-bar-tab--active" : ""}`} aria-label="Open telemetry">
          <IconTelemetry className="icon-sm" aria-hidden strokeWidth={1.5} /> Telemetry
        </NavLink>
        <span className="nav-action-divider" aria-hidden />
        <Button
          variant="ghost"
          size="sm"
          className="command-bar-action"
          onClick={() => setResyncConfirmOpen(true)}
          aria-label="Run cluster resync"
        >
          <IconResync className="icon-sm" aria-hidden strokeWidth={1.5} /> Resync
        </Button>
        <RefreshButton
          variant="ghost"
          size="sm"
          className="command-bar-action"
          onRefresh={handleRefresh}
          data-testid="dashboard-refresh"
          ariaLabel="Refresh now"
          icon={<IconRefresh className="icon-sm" aria-hidden strokeWidth={1.5} />}
          idleLabel="Refresh"
          loadingLabel="Updating…"
          successLabel="Updated just now"
          errorLabel="Update failed"
        />
        <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)} data-testid="dashboard-settings" aria-label="Dashboard settings">
          <IconSettings className="icon-sm" aria-hidden strokeWidth={1.5} />
        </Button>
        </>
      }>
      <div className="dashboard-strips operator-dashboard-strips">
        <RevenueStrip />
        <SubscriptionHealthStrip />
        <ReferralStrip />
        <AlertsPanel />
      </div>
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
    </DashboardPageTemplate>
  );
}
