import { Guard } from "@/core/auth/Guard";
import { DashboardShell } from "@/layout/DashboardShell";

export function RootLayout() {
  return (
    <Guard>
      <DashboardShell />
    </Guard>
  );
}
