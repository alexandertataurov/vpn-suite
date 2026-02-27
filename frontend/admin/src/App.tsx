import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer, Skeleton } from "@vpn-suite/shared/ui";
import { AdminLayout } from "./layouts/AdminLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { TelemetryPageViewTracker } from "./components/TelemetryPageViewTracker";

const LoginPage = lazy(() => import("./pages/Login").then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import("./pages/Dashboard").then((m) => ({ default: m.DashboardPage })));
const TelemetryPage = lazy(() => import("./pages/Telemetry").then((m) => ({ default: m.TelemetryPage })));
const ControlPlanePage = lazy(() => import("./pages/ControlPlane").then((m) => ({ default: m.ControlPlanePage })));
const ServersPage = lazy(() => import("./pages/Servers").then((m) => ({ default: m.ServersPage })));
const UsersPage = lazy(() => import("./pages/Users").then((m) => ({ default: m.UsersPage })));
const UserDetailPage = lazy(() => import("./pages/UserDetail").then((m) => ({ default: m.UserDetailPage })));
const BillingPage = lazy(() => import("./pages/Billing").then((m) => ({ default: m.BillingPage })));
const DevicesPage = lazy(() => import("./pages/Devices").then((m) => ({ default: m.DevicesPage })));
const AuditPage = lazy(() => import("./pages/Audit").then((m) => ({ default: m.AuditPage })));
const ServerNewPage = lazy(() => import("./pages/ServerNew").then((m) => ({ default: m.ServerNewPage })));
const ServerDetailPage = lazy(() => import("./pages/ServerDetail").then((m) => ({ default: m.ServerDetailPage })));
const ServerEditPage = lazy(() => import("./pages/ServerEdit").then((m) => ({ default: m.ServerEditPage })));
const SettingsPage = lazy(() => import("./pages/Settings").then((m) => ({ default: m.SettingsPage })));
const StyleguidePage = lazy(() => import("./pages/Styleguide").then((m) => ({ default: m.StyleguidePage })));

function App() {
  return (
    <ErrorBoundary>
      <ToastContainer>
          <TelemetryPageViewTracker />
          <Suspense fallback={<div className="admin-loading"><Skeleton height={24} /></div>}>
            <Routes>
              <Route
                path="/login"
                element={
                  <ErrorBoundary>
                    <LoginPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route
                  index
                  element={
                    <ErrorBoundary>
                      <DashboardPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="telemetry"
                  element={
                    <ErrorBoundary>
                      <TelemetryPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="automation"
                  element={
                    <ErrorBoundary>
                      <ControlPlanePage />
                    </ErrorBoundary>
                  }
                />
                <Route path="control-plane" element={<Navigate to="/automation" replace />} />
                <Route
                  path="servers"
                  element={
                    <ErrorBoundary>
                      <ServersPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="servers/new"
                  element={
                    <ErrorBoundary>
                      <ServerNewPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="servers/:id/edit"
                  element={
                    <ErrorBoundary>
                      <ServerEditPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="servers/:id"
                  element={
                    <ErrorBoundary>
                      <ServerDetailPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="users"
                  element={
                    <ErrorBoundary>
                      <UsersPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="users/:id"
                  element={
                    <ErrorBoundary>
                      <UserDetailPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="billing"
                  element={
                    <ErrorBoundary>
                      <BillingPage />
                    </ErrorBoundary>
                  }
                />
                <Route path="subscriptions" element={<Navigate to="/billing?tab=subscriptions" replace />} />
                <Route
                  path="devices"
                  element={
                    <ErrorBoundary>
                      <DevicesPage />
                    </ErrorBoundary>
                  }
                />
                <Route path="payments" element={<Navigate to="/billing?tab=payments" replace />} />
                <Route
                  path="audit"
                  element={
                    <ErrorBoundary>
                      <AuditPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <ErrorBoundary>
                      <SettingsPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="styleguide"
                  element={
                    <ErrorBoundary>
                      <StyleguidePage />
                    </ErrorBoundary>
                  }
                />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
      </ToastContainer>
    </ErrorBoundary>
  );
}

export default App;
