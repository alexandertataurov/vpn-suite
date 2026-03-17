import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { ErrorBoundary } from "@/core/errors/Boundary";
import { DashboardTopbar, useLiveClock } from "./DashboardTopbar";
import { DashboardSidebar, SIDEBAR_NAV_ID } from "./DashboardSidebar";
import { DashboardStatusBar } from "./DashboardStatusBar";

export function DashboardShell() {
  const clock = useLiveClock();
  const [sidebarOverlayOpen, setSidebarOverlayOpen] = useState(false);

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
        <DashboardStatusBar clockText={clock} />
      </main>
    </div>
  );
}
