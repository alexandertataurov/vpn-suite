import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { track } from "@vpn-suite/shared";
import { RootLayout } from "./RootLayout";
import { ErrorBoundary } from "@/core/errors/Boundary";
import { Skeleton } from "@/design-system/primitives";

const BASE_TITLE = "VPN Suite Admin";
const ROUTE_TITLES: Record<string, string> = {
  "/": "Overview",
  "/login": "Login",
  "/servers": "Servers",
  "/servers/nodes": "VPN Nodes",
  "/telemetry": "Telemetry",
  "/users": "Users",
  "/devices": "Devices",
  "/automation": "Automation",
  "/revenue": "Revenue",
  "/billing": "Billing",
  "/audit": "Audit",
  "/news": "News",
  "/settings": "Settings",
  "/styleguide": "Styleguide",
};

function DocumentTitle() {
  const { pathname } = useLocation();
  const pageTitle = ROUTE_TITLES[pathname] ?? "Overview";
  useEffect(() => {
    document.title = pageTitle === BASE_TITLE ? BASE_TITLE : `${pageTitle} — ${BASE_TITLE}`;
  }, [pageTitle]);
  useEffect(() => {
    if (pathname !== "/login") {
      track("admin.page_view", { route: pathname, page: pathname });
    }
  }, [pathname]);
  return null;
}

const LoginPage = lazy(() => import("@/features/login/LoginPage").then((m) => ({ default: m.LoginPage })));
const OverviewPage = lazy(() => import("@/features/overview/OverviewPage").then((m) => ({ default: m.OverviewPage })));
const ServersPage = lazy(() => import("@/features/servers/ServersPage").then((m) => ({ default: m.ServersPage })));
const VpnNodesPage = lazy(() => import("@/features/vpn-nodes/VpnNodesPage").then((m) => ({ default: m.VpnNodesPage })));
const TelemetryPage = lazy(() => import("@/features/telemetry/TelemetryPage").then((m) => ({ default: m.TelemetryPage })));
const UsersPage = lazy(() => import("@/features/users/UsersPage").then((m) => ({ default: m.UsersPage })));
const DevicesPage = lazy(() => import("@/features/devices/DevicesPage").then((m) => ({ default: m.DevicesPage })));
const AutomationPage = lazy(() => import("@/features/automation/AutomationPage").then((m) => ({ default: m.AutomationPage })));
const RevenuePage = lazy(() => import("@/features/revenue/RevenuePage").then((m) => ({ default: m.RevenuePage })));
const BillingPage = lazy(() => import("@/features/billing/BillingPage").then((m) => ({ default: m.BillingPage })));
const AuditPage = lazy(() => import("@/features/audit/AuditPage").then((m) => ({ default: m.AuditPage })));
const NewsPage = lazy(() => import("@/features/news/NewsPage").then((m) => ({ default: m.NewsPage })));
const SettingsPage = lazy(() => import("@/features/settings/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const StyleguidePage = lazy(() => import("@/features/styleguide/StyleguidePage").then((m) => ({ default: m.StyleguidePage })));

function RouteFallback() {
  return (
    <div className="shell-loading" aria-busy="true" aria-label="Loading page">
      <Skeleton height={24} />
    </div>
  );
}

export function AppRouter() {
  return (
    <>
      <DocumentTitle />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
        <Route path="/login" element={<ErrorBoundary><LoginPage /></ErrorBoundary>} />
        <Route path="/" element={<RootLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="servers/nodes" element={<ErrorBoundary><VpnNodesPage /></ErrorBoundary>} />
          <Route path="servers" element={<ServersPage />} />
          <Route path="telemetry" element={<TelemetryPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="devices" element={<DevicesPage />} />
          <Route path="automation" element={<AutomationPage />} />
          <Route path="revenue" element={<RevenuePage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="styleguide" element={<StyleguidePage />} />
          <Route path="control-plane" element={<Navigate to="/automation" replace />} />
          <Route path="subscriptions" element={<Navigate to="/billing?tab=subscriptions" replace />} />
          <Route path="payments" element={<Navigate to="/billing?tab=payments" replace />} />
          <Route path="promo" element={<Navigate to="/" replace />} />
          <Route path="referrals" element={<Navigate to="/" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </>
  );
}
