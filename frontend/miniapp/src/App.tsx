import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Skeleton } from "./ui";
import { ViewportLayout } from "./app/ViewportLayout";
import { MainButtonReserveProvider } from "./context/MainButtonReserveContext";
import { TelegramProvider } from "./context/TelegramContext";
import { TelegramThemeBridge } from "@/components";
import { useTelemetry } from "./hooks/useTelemetry";
import { useScrollInputIntoView } from "./hooks/useScrollInputIntoView";
import { useLayoutDebugMode } from "./hooks/useLayoutDebugMode";
import { useGlobalHapticFeedback } from "./hooks/useGlobalHapticFeedback";
import { BootstrapController } from "./bootstrap/BootstrapController";
import { AppRoot } from "./app/AppRoot";
import { SafeAreaLayer } from "./app/SafeAreaLayer";
import { OverlayLayer } from "./app/OverlayLayer";
import { TelegramEventManager } from "./app/TelegramEventManager";

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
  useScrollInputIntoView();
  useLayoutDebugMode();
  useGlobalHapticFeedback();
  useEffect(() => {
    track("app_open", {});
  }, [track]);

  return (
    <AppRoot>
      <TelegramProvider>
        <TelegramThemeBridge />
        <TelegramEventManager />
        <SafeAreaLayer>
          <BootstrapController>
            <MainButtonReserveProvider>
              <OverlayLayer>
                <Suspense fallback={<div className="miniapp-loading"><Skeleton height={24} /></div>}>
                  <Routes>
                    <Route element={<ViewportLayout mode="stack" />}>
                      <Route path="/onboarding" element={<OnboardingPage />} />
                      <Route path="/plan/checkout/:planId" element={<CheckoutPage />} />
                      <Route path="/servers" element={<ServerSelectionPage />} />
                      <Route path="/referral" element={<ReferralPage />} />
                    </Route>
                    <Route element={<ViewportLayout mode="tabbed" />}>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/devices" element={<DevicesPage />} />
                      <Route path="/plan" element={<PlanPage />} />
                      <Route path="/support" element={<SupportPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </OverlayLayer>
            </MainButtonReserveProvider>
          </BootstrapController>
        </SafeAreaLayer>
      </TelegramProvider>
    </AppRoot>
  );
}

export default App;
