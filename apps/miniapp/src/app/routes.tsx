import { lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useBootstrapContext } from "@/app/bootstrap/context";

const HomePage = lazy(() => import("@/features/home/HomePage").then((m) => ({ default: m.HomePage })));
const OnboardingPage = lazy(() => import("@/features/onboarding/OnboardingPage").then((m) => ({ default: m.OnboardingPage })));
const CheckoutPage = lazy(() => import("@/features/checkout/CheckoutPage").then((m) => ({ default: m.CheckoutPage })));
const PlanPage = lazy(() => import("@/features/plan/PlanPage").then((m) => ({ default: m.PlanPage })));
const SettingsPage = lazy(() => import("@/features/settings/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const DevicesPage = lazy(() => import("@/features/devices/DevicesPage").then((m) => ({ default: m.DevicesPage })));
const SupportPage = lazy(() => import("@/features/support/SupportPage").then((m) => ({ default: m.SupportPage })));
const RestoreAccessPage = lazy(() =>
  import("@/features/restore-access/RestoreAccessPage").then((m) => ({ default: m.RestoreAccessPage })),
);
const ConnectStatusPage = lazy(() =>
  import("@/features/connect-status/ConnectStatusPage").then((m) => ({ default: m.ConnectStatusPage })),
);
const ReferralPage = lazy(() => import("@/features/referral/ReferralPage").then((m) => ({ default: m.ReferralPage })));
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
        <Route path="/connect-status" element={<ConnectStatusPage />} />
        <Route path="/restore-access" element={<RestoreAccessPage />} />
        <Route path="/referral" element={<ReferralPage />} />
        <Route path="/servers" element={<Navigate to="/" replace />} />
        <Route path="/account/subscription" element={<Navigate to="/plan" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
