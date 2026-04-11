import type { ReactNode } from "react";
import { AppErrorBoundary } from "@/app/AppErrorBoundary";
import { AppRoot } from "@/app/AppRoot";
import { OverlayLayer } from "@/app/OverlayLayer";
import { SafeAreaLayer } from "@/app/SafeAreaLayer";
import { TelegramEventManager } from "@/app/TelegramEventManager";
import { MainButtonReserveProvider } from "@/context/MainButtonReserveContext";
import { TelegramProvider } from "@/context/TelegramContext";
import { TelegramThemeBridge } from "@/design-system";
import { StorybookQueryClientProvider } from "./queryClient";

export type StorybookDensity = "compact" | "default" | "comfortable";

export interface StorybookMiniappShellProps {
  children: ReactNode;
  isPageStory?: boolean;
  viewportWidth?: number;
  isDesktop?: boolean;
  density?: StorybookDensity;
}

interface StorybookFrameProps {
  children: ReactNode;
  density: StorybookDensity;
  isDesktop: boolean;
  isPageStory: boolean;
  viewportWidth: number;
}

function toDataAttributeValue(value: boolean) {
  return value ? "true" : "false";
}

function StorybookFrame({
  children,
  density,
  isDesktop,
  isPageStory,
  viewportWidth,
}: StorybookFrameProps) {
  return (
    <div
      className="sb-miniapp-frame docs-pres-stories"
      data-page-story={toDataAttributeValue(isPageStory)}
      data-density={density}
    >
      <div
        className="sb-miniapp-viewport"
        data-page-story={toDataAttributeValue(isPageStory)}
        data-desktop={toDataAttributeValue(isDesktop)}
        data-viewport-width={viewportWidth}
        data-density={density}
      >
        {children}
      </div>
    </div>
  );
}

StorybookFrame.displayName = "StorybookFrame";

export function StorybookMiniappShell({
  children,
  isPageStory = false,
  viewportWidth = 390,
  isDesktop = false,
  density = "default",
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
                  <StorybookFrame
                    isPageStory={isPageStory}
                    viewportWidth={viewportWidth}
                    isDesktop={isDesktop}
                    density={density}
                  >
                    {children}
                  </StorybookFrame>
                </OverlayLayer>
              </MainButtonReserveProvider>
            </SafeAreaLayer>
          </TelegramProvider>
        </AppRoot>
      </StorybookQueryClientProvider>
    </AppErrorBoundary>
  );
}
