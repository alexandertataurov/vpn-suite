import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer, Skeleton } from "./ui";
import { TabbedShellLayout, StackFlowLayout } from "./layouts/MiniappLayout";
import { TelegramThemeBridge } from "@/components";
import { useTelemetry } from "./hooks/useTelemetry";
import { useViewportDimensions } from "./hooks/useViewportDimensions";
import { useScrollInputIntoView } from "./hooks/useScrollInputIntoView";
import { useLayoutDebugMode } from "./hooks/useLayoutDebugMode";
import { useGlobalHapticFeedback } from "./hooks/useGlobalHapticFeedback";
import { BootstrapController } from "./bootstrap/BootstrapController";

const HomePage = lazy(() => import("./pages/Home").then((m) => ({ default: m.HomePage })));
const PlanPage = lazy(() => import("./pages/Plan").then((m) => ({ default: m.PlanPage })));
const CheckoutPage = lazy(() => import("./pages/Checkout").then((m) => ({ default: m.CheckoutPage })));
const DevicesPage = lazy(() => import("./pages/Devices").then((m) => ({ default: m.DevicesPage })));
const ReferralPage = lazy(() => import("./pages/Referral").then((m) => ({ default: m.ReferralPage })));
const SupportPage = lazy(() => import("./pages/Support").then((m) => ({ default: m.SupportPage })));
const SettingsPage = lazy(() => import("./pages/Settings").then((m) => ({ default: m.SettingsPage })));
const ServerSelectionPage = lazy(
  () => import("./pages/ServerSelection").then((m) => ({ default: m.ServerSelectionPage })),
);
const OnboardingPage = lazy(() =>
  import("./pages/Onboarding").then((m) => ({ default: m.OnboardingPage })),
);

function App() {
  const { track } = useTelemetry();
  useViewportDimensions();
  useScrollInputIntoView();
  useLayoutDebugMode();
  useGlobalHapticFeedback();
  useEffect(() => {
    track("app_open", {});
  }, [track]);

  return (
    <ToastContainer>
      <TelegramThemeBridge />
      <BootstrapController>
        <Suspense fallback={<div className="miniapp-loading"><Skeleton height={24} /></div>}>
          <Routes>
            <Route element={<StackFlowLayout />}>
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/plan/checkout/:planId" element={<CheckoutPage />} />
              <Route path="/servers" element={<ServerSelectionPage />} />
              <Route path="/referral" element={<ReferralPage />} />
            </Route>
            <Route element={<TabbedShellLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/devices" element={<DevicesPage />} />
              <Route path="/plan" element={<PlanPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BootstrapController>
    </ToastContainer>
  );
}

export default App;
