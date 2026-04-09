import { lazy, Suspense } from "react";
import { MainButtonReserveProvider } from "@/context/MainButtonReserveContext";
import { TelegramLoadingScreen } from "@/app/TelegramLoadingScreen";
import { TelegramProvider } from "@/context/TelegramContext";
import { TelegramThemeBridge } from "@/design-system";
import { AppRoot } from "@/app/AppRoot";
import { SafeAreaLayer } from "@/app/SafeAreaLayer";
import { OverlayLayer } from "@/app/OverlayLayer";
import { TelegramEventManager } from "@/app/TelegramEventManager";
import { WebappAuthRefresh } from "@/app/WebappAuthRefresh";
import { AppRoutes } from "@/app/routes";

const BootstrapController = lazy(() =>
  import("@/bootstrap/BootstrapController").then((m) => ({ default: m.BootstrapController })),
);

/**
 * Root app shell: composes providers and routes.
 * Provider order (outer → inner): AppRoot, TelegramProvider, TelegramThemeBridge,
 * TelegramEventManager, SafeAreaLayer, MainButtonReserveProvider, OverlayLayer,
 * WebappAuthRefresh, Suspense, BootstrapController, Routes.
 */
export function AppShell() {
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
                  <AppRoutes />
                </BootstrapController>
              </Suspense>
            </OverlayLayer>
          </MainButtonReserveProvider>
        </SafeAreaLayer>
      </TelegramProvider>
    </AppRoot>
  );
}
