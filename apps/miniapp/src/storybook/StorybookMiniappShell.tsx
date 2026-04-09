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

export type Density = "comfortable" | "compact";

export interface StorybookMiniappShellProps {
  children: ReactNode;
  /** Set to true for full-page stories that should bypass the viewport frame */
  isPageStory?: boolean;
  /** Simulated viewport width in px — mirrors real device widths (default: 390) */
  viewportWidth?: number;
  /** Renders the desktop layout variant */
  isDesktop?: boolean;
  density?: Density;
}

/**
 * Storybook decorator that wraps stories in the full Miniapp provider stack.
 *
 * Provider order mirrors AppRoot rendering in production to ensure stories
 * behave identically to the real app shell.
 */
export function StorybookMiniappShell({
  children,
  isPageStory = false,
  viewportWidth = 390,
  isDesktop = false,
  density = "comfortable",
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
                  <MiniappFrame
                    isPageStory={isPageStory}
                    viewportWidth={viewportWidth}
                    isDesktop={isDesktop}
                    density={density}
                  >
                    {children}
                  </MiniappFrame>
                </OverlayLayer>
              </MainButtonReserveProvider>
            </SafeAreaLayer>
          </TelegramProvider>
        </AppRoot>
      </StorybookQueryClientProvider>
    </AppErrorBoundary>
  );
}

// ---------------------------------------------------------------------------
// Internal — isolated so the data-attribute mapping is testable independently
// ---------------------------------------------------------------------------

interface MiniappFrameProps {
  children: ReactNode;
  isPageStory: boolean;
  viewportWidth: number;
  isDesktop: boolean;
  density: Density;
}

function MiniappFrame({
  children,
  isPageStory,
  viewportWidth,
  isDesktop,
  density,
}: MiniappFrameProps) {
  // data-* attributes use string literals so CSS selectors like
  // [data-page-story="true"] work without Boolean coercion surprises.
  const boolAttr = (v: boolean) => (v ? "true" : "false");

  return (
    <div
      className="sb-miniapp-frame"
      data-page-story={boolAttr(isPageStory)}
      data-density={density}
    >
      <div
        className="sb-miniapp-viewport"
        data-page-story={boolAttr(isPageStory)}
        data-desktop={boolAttr(isDesktop)}
        data-viewport-width={viewportWidth}
        data-density={density}
      >
        {children}
      </div>
    </div>
  );
}