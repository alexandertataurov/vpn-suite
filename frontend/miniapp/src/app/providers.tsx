import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { MainButtonReserveProvider } from "@/context/MainButtonReserveContext";
import { TelegramLoadingScreen } from "@/app/TelegramLoadingScreen";
import { TelegramProvider } from "@/context/TelegramContext";
import { TelegramThemeBridge } from "@/design-system";
import { AppRoot } from "@/app/AppRoot";
import { SafeAreaLayer } from "@/app/SafeAreaLayer";
import { OverlayLayer } from "@/app/OverlayLayer";
import { TelegramEventManager } from "@/app/TelegramEventManager";
import { WebappAuthRefresh } from "@/app/WebappAuthRefresh";

const HomePage = lazy(() => import("@/pages/Home").then((m) => ({ default: m.HomePage })));
const PlanPage = lazy(() => import("@/pages/Plan").then((m) => ({ default: m.PlanPage })));
const CheckoutPage = lazy(() => import("@/pages/Checkout").then((m) => ({ default: m.CheckoutPage })));
const DevicesPage = lazy(() => import("@/pages/Devices").then((m) => ({ default: m.DevicesPage })));
const ReferralPage = lazy(() => import("@/pages/Referral").then((m) => ({ default: m.ReferralPage })));
const SupportPage = lazy(() => import("@/pages/Support").then((m) => ({ default: m.SupportPage })));
const SettingsPage = lazy(() => import("@/pages/Settings").then((m) => ({ default: m.SettingsPage })));
const ServerSelectionPage = lazy(() =>
  import("@/pages/ServerSelection").then((m) => ({ default: m.ServerSelectionPage })),
);
const OnboardingPage = lazy(() =>
  import("@/pages/Onboarding").then((m) => ({ default: m.OnboardingPage })),
);
const ConnectStatusPage = lazy(() =>
  import("@/pages/ConnectStatus").then((m) => ({ default: m.ConnectStatusPage })),
);
const RestoreAccessPage = lazy(() =>
  import("@/pages/RestoreAccess").then((m) => ({ default: m.RestoreAccessPage })),
);
const TabbedShellLayout = lazy(() =>
  import("@/app/ViewportLayout").then((m) => ({ default: m.TabbedShellLayout })),
);
const StackFlowLayout = lazy(() =>
  import("@/app/ViewportLayout").then((m) => ({ default: m.StackFlowLayout })),
);
const BootstrapController = lazy(() =>
  import("@/bootstrap/BootstrapController").then((m) => ({ default: m.BootstrapController })),
);

export function Providers() {
  return (
    <AppRoot>
      <TelegramProvider>
        <TelegramThemeBridge />
        <TelegramEventManager />
        <SafeAreaLayer>
          <MainButtonReserveProvider>
            <OverlayLayer>
              <WebappAuthRefresh />
              <Suspense fallback={<TelegramLoadingScreen />}>
                <BootstrapController>
                  <Routes>
                    <Route element={<StackFlowLayout />}>
                      <Route path="/onboarding" element={<OnboardingPage />} />
                      <Route path="/plan/checkout/:planId" element={<CheckoutPage />} />
                      <Route path="/devices/issue" element={<DevicesPage />} />
                      <Route path="/connect-status" element={<ConnectStatusPage />} />
                      <Route path="/restore-access" element={<RestoreAccessPage />} />
                      {/* Spec §7.3: backend returns /account/subscription for cancel_at_period_end; redirect intentional: Plan page covers subscription state. */}
                      <Route path="/account/subscription" element={<Navigate to="/plan" replace />} />
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
                </BootstrapController>
              </Suspense>
            </OverlayLayer>
          </MainButtonReserveProvider>
        </SafeAreaLayer>
      </TelegramProvider>
    </AppRoot>
  );
}
