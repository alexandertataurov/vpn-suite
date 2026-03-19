import type { ReactNode } from "react";
import { AppRoot } from "@/app/AppRoot";
import { AppErrorBoundary } from "@/app/AppErrorBoundary";
import { OverlayLayer } from "@/app/OverlayLayer";
import { SafeAreaLayer } from "@/app/SafeAreaLayer";
import { TelegramEventManager } from "@/app/TelegramEventManager";
import { MainButtonReserveProvider } from "@/context/MainButtonReserveContext";
import { TelegramProvider } from "@/context/TelegramContext";
import { TelegramThemeBridge } from "@/design-system";
import { StorybookQueryClientProvider } from "./queryClient";

export interface StorybookMiniappShellProps {
  children: ReactNode;
  isPageStory?: boolean;
  viewportWidth?: number;
  isDesktop?: boolean;
}

export function StorybookMiniappShell({
  children,
  isPageStory = false,
  viewportWidth = 390,
  isDesktop = false,
}: StorybookMiniappShellProps) {
  return (
    <AppErrorBoundary>
      <StorybookQueryClientProvider>
        <AppRoot>
          <TelegramProvider>
            <TelegramThemeBridge />
            <TelegramEventManager />
            <SafeAreaLayer>
              <MainButtonReserveProvider>
                <OverlayLayer>
                  <div
                    className="sb-miniapp-frame"
                    data-page-story={isPageStory ? "true" : "false"}
                  >
                    <div
                      className="sb-miniapp-viewport"
                      data-page-story={isPageStory ? "true" : "false"}
                      data-desktop={isDesktop ? "true" : "false"}
                      data-viewport-width={String(viewportWidth)}
                    >
                      {children}
                    </div>
                  </div>
                </OverlayLayer>
              </MainButtonReserveProvider>
            </SafeAreaLayer>
          </TelegramProvider>
        </AppRoot>
      </StorybookQueryClientProvider>
    </AppErrorBoundary>
  );
}
