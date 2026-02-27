import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer, Skeleton } from "@vpn-suite/shared/ui";
import { AuthGuard } from "./components/AuthGuard";
import { MiniappLayout } from "./layouts/MiniappLayout";
import { TelegramThemeBridge } from "./components/TelegramThemeBridge";

const HomePage = lazy(() => import("./pages/Home").then((m) => ({ default: m.HomePage })));
const PlanPage = lazy(() => import("./pages/Plan").then((m) => ({ default: m.PlanPage })));
const PlansPage = lazy(() => import("./pages/Plans").then((m) => ({ default: m.PlansPage })));
const CheckoutPage = lazy(() => import("./pages/Checkout").then((m) => ({ default: m.CheckoutPage })));
const DevicesPage = lazy(() => import("./pages/Devices").then((m) => ({ default: m.DevicesPage })));
const ReferralPage = lazy(() => import("./pages/Referral").then((m) => ({ default: m.ReferralPage })));
const SupportPage = lazy(() => import("./pages/Support").then((m) => ({ default: m.SupportPage })));
const SettingsPage = lazy(() => import("./pages/Settings").then((m) => ({ default: m.SettingsPage })));
const UsagePage = lazy(() => import("./pages/Usage").then((m) => ({ default: m.UsagePage })));
const ServerSelectionPage = lazy(
  () => import("./pages/ServerSelection").then((m) => ({ default: m.ServerSelectionPage })),
);

function App() {
  return (
    <ToastContainer>
      <TelegramThemeBridge />
      <AuthGuard>
        <Suspense fallback={<div className="miniapp-loading"><Skeleton height={24} /></div>}>
          <Routes>
            <Route element={<MiniappLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/devices" element={<DevicesPage />} />
              <Route path="/plan" element={<PlanPage />} />
              <Route path="/servers" element={<ServerSelectionPage />} />
              <Route path="/usage" element={<UsagePage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="/plan/checkout/:planId" element={<div className="miniapp-stack"><CheckoutPage /></div>} />
            <Route path="/referral" element={<div className="miniapp-stack"><ReferralPage /></div>} />
          </Routes>
        </Suspense>
      </AuthGuard>
    </ToastContainer>
  );
}

export default App;
