import { lazy, type ReactNode } from "react";
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
const SetupGuidePage = lazy(() =>
  import("@/features/setup-guide/SetupGuidePage").then((m) => ({ default: m.SetupGuidePage })),
);
const MockDesignIndexPage = lazy(() =>
  import("@/features/mock/VisualMockPages").then((m) => ({ default: m.MockDesignIndexPage })),
);
const MockPageHome = lazy(() =>
  import("@/features/mock/VisualMockPages").then((m) => ({ default: m.MockPageHome })),
);
const MockPagePlan = lazy(() =>
  import("@/features/mock/VisualMockPages").then((m) => ({ default: m.MockPagePlan })),
);
const MockPageDevices = lazy(() =>
  import("@/features/mock/VisualMockPages").then((m) => ({ default: m.MockPageDevices })),
);
const MockPageSettings = lazy(() =>
  import("@/features/mock/VisualMockPages").then((m) => ({ default: m.MockPageSettings })),
);
const MockPageSupport = lazy(() =>
  import("@/features/mock/VisualMockPages").then((m) => ({ default: m.MockPageSupport })),
);
const MockPageCheckout = lazy(() =>
  import("@/features/mock/VisualMockPages").then((m) => ({ default: m.MockPageCheckout })),
);
const MockPageOnboarding = lazy(() =>
  import("@/features/mock/VisualMockPages").then((m) => ({ default: m.MockPageOnboarding })),
);
const MockPageSetupGuide = lazy(() =>
  import("@/features/mock/VisualMockPages").then((m) => ({ default: m.MockPageSetupGuide })),
);
const MockPageConnectStatus = lazy(() =>
  import("@/features/mock/VisualMockPages").then((m) => ({ default: m.MockPageConnectStatus })),
);
const MockPageRestoreAccess = lazy(() =>
  import("@/features/mock/VisualMockPages").then((m) => ({ default: m.MockPageRestoreAccess })),
);
const MockPageReferral = lazy(() =>
  import("@/features/mock/VisualMockPages").then((m) => ({ default: m.MockPageReferral })),
);
const MockComponentsButtons = lazy(() =>
  import("@/features/mock/VisualMockPages").then((m) => ({ default: m.MockComponentsButtons })),
);
const MockComponentsForms = lazy(() =>
  import("@/features/mock/VisualMockPages").then((m) => ({ default: m.MockComponentsForms })),
);
const MockComponentsFeedback = lazy(() =>
  import("@/features/mock/VisualMockPages").then((m) => ({ default: m.MockComponentsFeedback })),
);
const MockComponentsCards = lazy(() =>
  import("@/features/mock/VisualMockPages").then((m) => ({ default: m.MockComponentsCards })),
);
const MockMirrorProvider = lazy(() =>
  import("@/features/mock/MockMirrorProvider").then((m) => ({ default: m.MockMirrorProvider })),
);
const StackFlowLayout = lazy(() =>
  import("@/app/ViewportLayout").then((m) => ({ default: m.StackFlowLayout })),
);

function MockMirrorRoute({ children }: { children: ReactNode }) {
  return <MockMirrorProvider>{children}</MockMirrorProvider>;
}

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
        <Route path="/setup-guide" element={<SetupGuidePage />} />
        <Route path="/connect-status" element={<ConnectStatusPage />} />
        <Route path="/restore-access" element={<RestoreAccessPage />} />
        <Route path="/referral" element={<ReferralPage />} />
        <Route path="/mock" element={<MockDesignIndexPage />} />
        <Route path="/mock/pages/home" element={<MockPageHome />} />
        <Route path="/mock/pages/plan" element={<MockPagePlan />} />
        <Route path="/mock/pages/devices" element={<MockPageDevices />} />
        <Route path="/mock/pages/settings" element={<MockPageSettings />} />
        <Route path="/mock/pages/support" element={<MockPageSupport />} />
        <Route path="/mock/pages/checkout" element={<MockPageCheckout />} />
        <Route path="/mock/pages/onboarding" element={<MockPageOnboarding />} />
        <Route path="/mock/pages/setup-guide" element={<MockPageSetupGuide />} />
        <Route path="/mock/pages/connect-status" element={<MockPageConnectStatus />} />
        <Route path="/mock/pages/restore-access" element={<MockPageRestoreAccess />} />
        <Route path="/mock/pages/referral" element={<MockPageReferral />} />
        <Route path="/mock/components/buttons" element={<MockComponentsButtons />} />
        <Route path="/mock/components/forms" element={<MockComponentsForms />} />
        <Route path="/mock/components/feedback" element={<MockComponentsFeedback />} />
        <Route path="/mock/components/cards" element={<MockComponentsCards />} />
        <Route path="/mock/mirror" element={<Navigate to="/mock/mirror/home" replace />} />
        <Route path="/mock/mirror/home" element={<MockMirrorRoute><HomePage /></MockMirrorRoute>} />
        <Route path="/mock/mirror/onboarding" element={<MockMirrorRoute><OnboardingPage /></MockMirrorRoute>} />
        <Route path="/mock/mirror/plan" element={<MockMirrorRoute><PlanPage /></MockMirrorRoute>} />
        <Route path="/mock/mirror/plan/checkout/:planId" element={<MockMirrorRoute><CheckoutPage /></MockMirrorRoute>} />
        <Route path="/mock/mirror/devices" element={<MockMirrorRoute><DevicesPage /></MockMirrorRoute>} />
        <Route path="/mock/mirror/settings" element={<MockMirrorRoute><SettingsPage /></MockMirrorRoute>} />
        <Route path="/mock/mirror/support" element={<MockMirrorRoute><SupportPage /></MockMirrorRoute>} />
        <Route path="/mock/mirror/setup-guide" element={<MockMirrorRoute><SetupGuidePage /></MockMirrorRoute>} />
        <Route path="/mock/mirror/connect-status" element={<MockMirrorRoute><ConnectStatusPage /></MockMirrorRoute>} />
        <Route path="/mock/mirror/restore-access" element={<MockMirrorRoute><RestoreAccessPage /></MockMirrorRoute>} />
        <Route path="/mock/mirror/referral" element={<MockMirrorRoute><ReferralPage /></MockMirrorRoute>} />
        <Route path="/mock/design" element={<Navigate to="/mock/pages/home" replace />} />
        <Route path="/mock/design/checkout" element={<Navigate to="/mock/pages/checkout" replace />} />
        <Route path="/mock/design/settings" element={<Navigate to="/mock/pages/settings" replace />} />
        <Route path="/servers" element={<Navigate to="/" replace />} />
        <Route path="/account/subscription" element={<Navigate to="/plan" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
