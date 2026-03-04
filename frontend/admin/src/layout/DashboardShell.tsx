import { Outlet } from "react-router-dom";
import { DashboardTopbar, useLiveClock } from "./DashboardTopbar";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardStatusBar } from "./DashboardStatusBar";

export function DashboardShell() {
  const clock = useLiveClock();

  return (
    <div className="shell">
      <DashboardTopbar />
      <DashboardSidebar />
      <main className="main">
        <div className="page">
          <Outlet />
        </div>
        <DashboardStatusBar clockText={clock} />
      </main>
    </div>
  );
}

