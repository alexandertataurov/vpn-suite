import type { ComponentType, ReactNode } from "react";
import type { Decorator } from "@storybook/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { StackFlowLayout } from "@/app/ViewportLayout";
import { ToastContainer } from "@/design-system";
import { StorybookQueryClientProvider } from "./queryClient";
import { telegramClient } from "@/telegram/telegramCoreClient";

// ---------------------------------------------------------------------------
// Variant registry
//
// To add a new layout:
//   1. Add the string key to ViewportShellVariant.
//   2. Add the matching component to LAYOUT_COMPONENTS.
//   That's it — no other changes needed.
// ---------------------------------------------------------------------------

export type ViewportShellVariant = "stack";

/**
 * Maps each variant to its layout component.
 * Record<> ensures the map stays exhaustive as new variants are added —
 * a missing entry is a compile error, not a silent runtime undefined.
 */
const LAYOUT_COMPONENTS: Record<ViewportShellVariant, ComponentType> = {
  stack: StackFlowLayout,
};

// ---------------------------------------------------------------------------
// ViewportShellProviders
//
// Cross-cutting concerns shared by every variant:
// data-fetching (QueryClient) and the toast notification layer.
// ---------------------------------------------------------------------------

interface ViewportShellProvidersProps {
  children: ReactNode;
}

export function ViewportShellProviders({
  children,
}: ViewportShellProvidersProps) {
  return (
    <StorybookQueryClientProvider>
      <ToastContainer>{children}</ToastContainer>
    </StorybookQueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// ViewportShellRoutes
//
// Wires up an in-memory router with the correct layout component for the
// given variant. Keeping the router internal to this component means callers
// never have to think about MemoryRouter configuration.
// ---------------------------------------------------------------------------

export interface ViewportShellRoutesProps {
  children: ReactNode;
  variant: ViewportShellVariant;
  /**
   * Initial history stack for MemoryRouter.
   * The last entry is the one rendered first.
   * Typed as a non-empty tuple — MemoryRouter requires at least one entry.
   * Defaults to ["/"].
   */
  initialEntries?: [string, ...string[]];
}

export function ViewportShellRoutes({
  children,
  variant,
  initialEntries = ["/"],
}: ViewportShellRoutesProps) {
  const Layout = LAYOUT_COMPONENTS[variant];

  return (
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route element={<Layout />}>{children}</Route>
      </Routes>
    </MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// withViewportShell
//
// Storybook decorator factory. Composes providers + router + layout so that
// individual story files stay free of boilerplate.
//
// Usage:
//   export default {
//     decorators: [withViewportShell("stack")],
//   } satisfies Meta<typeof MyComponent>;
//
//   // With a parameterised route:
//   decorators: [
//     withViewportShell("stack", {
//       path: "/products/:id",
//       initialEntries: ["/products/42"],
//     }),
//   ]
// ---------------------------------------------------------------------------

export interface ViewportShellOptions {
  /**
   * History stack passed to MemoryRouter.
   * Useful when a story needs to start at a specific URL or simulate
   * navigation history (e.g. back-button behaviour).
   * Non-empty tuple so MemoryRouter always has at least one entry.
   */
  initialEntries?: [string, ...string[]];
  /**
   * React Router path pattern matched against the story route.
   * Use a pattern with params (e.g. "/products/:id") when the component
   * reads from useParams().
   * Defaults to "*" to match any URL without configuration.
   */
  path?: string;
}

export function withViewportShell(
  variant: ViewportShellVariant,
  options: ViewportShellOptions = {},
): Decorator {
  const { initialEntries, path = "*" } = options;

  function ViewportShellDecorator({ Story }: { Story: ComponentType }) {
    return (
      <ViewportShellProviders>
        <ViewportShellRoutes variant={variant} initialEntries={initialEntries}>
          <Route path={path} element={<Story />} />
        </ViewportShellRoutes>
      </ViewportShellProviders>
    );
  }

  ViewportShellDecorator.displayName = `ViewportShellDecorator(${variant})`;

  return ViewportShellDecorator as Decorator;
}

// ---------------------------------------------------------------------------
// Telegram environment decorator (Storybook toolbar -> window.Telegram.WebApp)
// ---------------------------------------------------------------------------

type TelegramToolbarGlobals = {
  tgPlatform?: unknown;
  tgFullscreen?: unknown;
};

function normalizePlatform(input: unknown): "ios" | "android" | "desktop" {
  const v = String(input ?? "ios").toLowerCase();
  if (v === "ios") return "ios";
  if (v === "android") return "android";
  return "desktop";
}

function normalizeFullscreen(input: unknown): boolean {
  return String(input ?? "false") === "true";
}

export function applyTelegramEnvironment(globals: TelegramToolbarGlobals): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const platform = normalizePlatform(globals.tgPlatform);
  const isFullscreen = normalizeFullscreen(globals.tgFullscreen);

  // Minimal mock for `telegramClient` (used by TelegramProvider + hooks).
  const mockWebApp = {
    platform,
    isFullscreen,
    isExpanded: true,
    viewportHeight: 844,
    viewportStableHeight: 844,
    safeAreaInset: { top: 0, bottom: 0, left: 0, right: 0 },
    contentSafeAreaInset: { top: 0, bottom: 0, left: 0, right: 0 },
    initData: "",
    initDataUnsafe: {},
    themeParams: {},
    colorScheme: "dark",
    ready: () => {},
    expand: () => {},
    close: () => {},
    requestFullscreen: () => {},
    exitFullscreen: () => {},
    disableVerticalSwipes: () => {},
    enableVerticalSwipes: () => {},
    onEvent: () => {},
    offEvent: () => {},
    MainButton: null,
    BackButton: null,
    CloudStorage: null,
    BiometricManager: null,
    HapticFeedback: {
      impactOccurred: () => {},
      notificationOccurred: () => {},
      selectionChanged: () => {},
    },
  };

  (window as unknown as { Telegram?: { WebApp: typeof mockWebApp } }).Telegram = { WebApp: mockWebApp };

  const root = document.documentElement;
  root.dataset.tgFullscreen = isFullscreen ? "true" : "false";
  root.dataset.tgPlatform = platform;
  root.dataset.tgDesktop = platform === "desktop" ? "true" : "false";

  // Ensure internal state hooks can read the new mock values.
  telegramClient.ready();
}

export const withTelegramEnvironment: Decorator = (Story, context) => {
  applyTelegramEnvironment(context.globals as TelegramToolbarGlobals);
  return <Story />;
};