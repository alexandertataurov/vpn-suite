import { useEffect, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import { ErrorBoundary } from "@/core/errors/Boundary";
import { useApiQuery } from "@/hooks/api/useApiQuery";
import { getSidebarRoutes } from "@/app/route-meta";
import { DashboardTopbar, useLiveClock } from "./DashboardTopbar";
import { DashboardSidebar, SIDEBAR_NAV_ID } from "./DashboardSidebar";
import { DashboardStatusBar } from "./DashboardStatusBar";
import type { AppSettingsOut } from "@/shared/types/admin-api";

interface ClusterHealthOut {
  nodes_total?: number;
  status_counts?: Record<string, number>;
}

export function DashboardShell() {
  const clock = useLiveClock();
  const [sidebarOverlayOpen, setSidebarOverlayOpen] = useState(false);
  const { data: appSettings } = useApiQuery<AppSettingsOut>(["app", "settings", "shell"], "/app/settings", {
    retry: 1,
    staleTime: 60_000,
  });
  const { data: clusterHealth } = useApiQuery<ClusterHealthOut>(["cluster", "health", "shell"], "/cluster/health", {
    retry: 1,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!sidebarOverlayOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSidebarOverlayOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOverlayOpen]);

  const quickLinks = useMemo(
    () =>
      getSidebarRoutes("Monitor")
        .slice(0, 3)
        .map((route) => ({ to: route.path, label: route.navLabel ?? route.title })),
    []
  );

  const buildLabel = appSettings?.environment === "production" ? "prod" : appSettings?.environment ?? "unknown";
  const statusCounts = clusterHealth?.status_counts ?? {};
  const healthyNodes = (statusCounts.healthy ?? 0) + (statusCounts.online ?? 0);
  const nodesTotal = clusterHealth?.nodes_total ?? 0;
  const clusterLabel = nodesTotal > 0 ? `Nodes ${healthyNodes}/${nodesTotal} healthy` : "Nodes unavailable";

  return (
    <div className="shell">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <DashboardTopbar
        onOpenMenu={() => setSidebarOverlayOpen(true)}
        isMenuOpen={sidebarOverlayOpen}
        navId={SIDEBAR_NAV_ID}
      />
      <DashboardSidebar
        isOverlayOpen={sidebarOverlayOpen}
        onCloseOverlay={() => setSidebarOverlayOpen(false)}
      />
      <main className="main" id="main-content">
        <div className="main__body">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
        <DashboardStatusBar
          clockText={clock}
          buildLabel={buildLabel}
          environmentLabel={`Environment ${appSettings?.environment ?? "unknown"}`}
          clusterLabel={clusterLabel}
          quickLinks={quickLinks}
        />
      </main>
    </div>
  );
}
