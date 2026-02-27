import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer, Skeleton } from "@vpn-suite/shared/ui";
import { AuthGuard } from "./components/AuthGuard";
import { MiniappLayout } from "./layouts/MiniappLayout";
import { TelegramThemeBridge } from "./components/TelegramThemeBridge";

const HomePage = lazy(() => import("./pages/Home").then((m) => ({ default: m.HomePage })));
const PlansPage = lazy(() => import("./pages/Plans").then((m) => ({ default: m.PlansPage })));
const CheckoutPage = lazy(() => import("./pages/Checkout").then((m) => ({ default: m.CheckoutPage })));
const DevicesPage = lazy(() => import("./pages/Devices").then((m) => ({ default: m.DevicesPage })));
const ProfilePage = lazy(() => import("./pages/Profile").then((m) => ({ default: m.ProfilePage })));
const ReferralPage = lazy(() => import("./pages/Referral").then((m) => ({ default: m.ReferralPage })));
const HelpPage = lazy(() => import("./pages/Help").then((m) => ({ default: m.HelpPage })));

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
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/help" element={<HelpPage />} />
            </Route>
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/checkout/:planId" element={<CheckoutPage />} />
            <Route path="/referral" element={<ReferralPage />} />
          </Routes>
        </Suspense>
      </AuthGuard>
    </ToastContainer>
  );
}

export default App;
