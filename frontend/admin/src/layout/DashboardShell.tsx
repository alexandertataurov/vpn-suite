import { useState } from "react";
import { Outlet } from "react-router-dom";
import { ErrorBoundary } from "@/core/errors/Boundary";
import { DashboardTopbar, useLiveClock } from "./DashboardTopbar";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardStatusBar } from "./DashboardStatusBar";

export function DashboardShell() {
  const clock = useLiveClock();
  const [sidebarOverlayOpen, setSidebarOverlayOpen] = useState(false);

  return (
    <div className="shell">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <DashboardTopbar onOpenMenu={() => setSidebarOverlayOpen(true)} />
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
        <DashboardStatusBar clockText={clock} />
      </main>
    </div>
  );
}

