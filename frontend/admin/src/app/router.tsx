import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { RootLayout } from "./RootLayout";
import { ErrorBoundary } from "@/core/errors/Boundary";
import { Skeleton } from "@/design-system";

const LoginPage = lazy(() => import("@/features/login/LoginPage").then((m) => ({ default: m.LoginPage })));
const OverviewPage = lazy(() => import("@/features/overview/OverviewPage").then((m) => ({ default: m.OverviewPage })));
const ServersPage = lazy(() => import("@/features/servers/ServersPage").then((m) => ({ default: m.ServersPage })));
const TelemetryPage = lazy(() => import("@/features/telemetry/TelemetryPage").then((m) => ({ default: m.TelemetryPage })));
const UsersPage = lazy(() => import("@/features/users/UsersPage").then((m) => ({ default: m.UsersPage })));
const DevicesPage = lazy(() => import("@/features/devices/DevicesPage").then((m) => ({ default: m.DevicesPage })));
const AutomationPage = lazy(() => import("@/features/automation/AutomationPage").then((m) => ({ default: m.AutomationPage })));
const RevenuePage = lazy(() => import("@/features/revenue/RevenuePage").then((m) => ({ default: m.RevenuePage })));
const BillingPage = lazy(() => import("@/features/billing/BillingPage").then((m) => ({ default: m.BillingPage })));
const AuditPage = lazy(() => import("@/features/audit/AuditPage").then((m) => ({ default: m.AuditPage })));
const SettingsPage = lazy(() => import("@/features/settings/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const StyleguidePage = lazy(() => import("@/features/styleguide/StyleguidePage").then((m) => ({ default: m.StyleguidePage })));

function RouteFallback() {
  return (
    <div className="shell-loading">
      <Skeleton height={24} />
    </div>
  );
}

export function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<ErrorBoundary><LoginPage /></ErrorBoundary>} />
        <Route path="/" element={<RootLayout />}>
          <Route index element={<ErrorBoundary><OverviewPage /></ErrorBoundary>} />
          <Route path="servers" element={<ErrorBoundary><ServersPage /></ErrorBoundary>} />
          <Route path="telemetry" element={<ErrorBoundary><TelemetryPage /></ErrorBoundary>} />
          <Route path="users" element={<ErrorBoundary><UsersPage /></ErrorBoundary>} />
          <Route path="devices" element={<ErrorBoundary><DevicesPage /></ErrorBoundary>} />
          <Route path="automation" element={<ErrorBoundary><AutomationPage /></ErrorBoundary>} />
          <Route path="revenue" element={<ErrorBoundary><RevenuePage /></ErrorBoundary>} />
          <Route path="billing" element={<ErrorBoundary><BillingPage /></ErrorBoundary>} />
          <Route path="audit" element={<ErrorBoundary><AuditPage /></ErrorBoundary>} />
          <Route path="settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
          <Route path="styleguide" element={<ErrorBoundary><StyleguidePage /></ErrorBoundary>} />
          <Route path="subscriptions" element={<Navigate to="/billing?tab=subscriptions" replace />} />
          <Route path="payments" element={<Navigate to="/billing?tab=payments" replace />} />
          <Route path="promo" element={<Navigate to="/" replace />} />
          <Route path="referrals" element={<Navigate to="/" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
