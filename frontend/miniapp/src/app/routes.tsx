import { lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useBootstrapContext } from "@/bootstrap/context";

const HomePage = lazy(() => import("@/pages/Home").then((m) => ({ default: m.HomePage })));
const OnboardingPage = lazy(() => import("@/pages/Onboarding").then((m) => ({ default: m.OnboardingPage })));
const CheckoutPage = lazy(() => import("@/pages/Checkout").then((m) => ({ default: m.CheckoutPage })));
const PlanPage = lazy(() => import("@/pages/Plan").then((m) => ({ default: m.PlanPage })));
const SettingsPage = lazy(() => import("@/pages/Settings").then((m) => ({ default: m.SettingsPage })));
const DevicesPage = lazy(() => import("@/pages/Devices").then((m) => ({ default: m.DevicesPage })));
const SupportPage = lazy(() => import("@/pages/Support").then((m) => ({ default: m.SupportPage })));
const RestoreAccessPage = lazy(() =>
  import("@/pages/RestoreAccess").then((m) => ({ default: m.RestoreAccessPage })),
);
const StackFlowLayout = lazy(() =>
  import("@/app/ViewportLayout").then((m) => ({ default: m.StackFlowLayout })),
);

export function AppRoutes() {
  const { phase, onboardingStep } = useBootstrapContext();
  const shouldForceOnboardingEntry = phase === "onboarding" && onboardingStep < 2;

  return (
    <Routes>
      <Route element={<StackFlowLayout />}>
        <Route
          path="/onboarding"
          element={phase === "app_ready" ? <Navigate to="/" replace /> : <OnboardingPage />}
        />
        <Route
          path="/"
          element={shouldForceOnboardingEntry ? <Navigate to="/onboarding" replace /> : <HomePage />}
        />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/plan" element={<PlanPage />} />
        <Route path="/plan/checkout/:planId" element={<CheckoutPage />} />
        <Route path="/devices" element={<DevicesPage />} />
        <Route path="/devices/issue" element={<DevicesPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/connect-status" element={<Navigate to="/" replace />} />
        <Route path="/restore-access" element={<RestoreAccessPage />} />
        <Route path="/referral" element={<Navigate to="/settings" replace />} />
        <Route path="/servers" element={<Navigate to="/" replace />} />
        <Route path="/account/subscription" element={<Navigate to="/plan" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
