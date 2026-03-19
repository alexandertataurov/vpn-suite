import { useMemo, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppRoot } from "@/app/AppRoot";
import { AppErrorBoundary } from "@/app/AppErrorBoundary";
import { OverlayLayer } from "@/app/OverlayLayer";
import { SafeAreaLayer } from "@/app/SafeAreaLayer";
import { TelegramEventManager } from "@/app/TelegramEventManager";
import { MainButtonReserveProvider } from "@/context/MainButtonReserveContext";
import { TelegramProvider } from "@/context/TelegramContext";
import { TelegramThemeBridge } from "@/design-system";

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
  const client = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      }),
    [],
  );

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={client}>
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
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
