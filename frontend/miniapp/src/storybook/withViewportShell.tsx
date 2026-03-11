import { useMemo, type ReactNode } from "react";
import type { Decorator } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { StackFlowLayout, TabbedShellLayout } from "@/app/ViewportLayout";

export type ViewportShellVariant = "tabbed" | "stack";

export function ViewportShellProviders({ children }: { children: ReactNode }) {
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
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  );
}

export function ViewportShellRoutes({
  children,
  initialEntries = ["/"],
  variant,
}: {
  children: ReactNode;
  initialEntries?: string[];
  variant: ViewportShellVariant;
}) {
  const Layout = variant === "stack" ? StackFlowLayout : TabbedShellLayout;

  return (
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route element={<Layout />}>{children}</Route>
      </Routes>
    </MemoryRouter>
  );
}

export function withViewportShell(
  variant: ViewportShellVariant,
  options?: { initialEntries?: string[]; path?: string },
): Decorator {
  const ViewportShellDecorator: Decorator = (Story) => (
    <ViewportShellProviders>
      <ViewportShellRoutes
        variant={variant}
        initialEntries={options?.initialEntries}
      >
        <Route path={options?.path ?? "*"} element={<Story />} />
      </ViewportShellRoutes>
    </ViewportShellProviders>
  );

  return ViewportShellDecorator;
}

export function isStackFlowStoryRoute(pathname: string) {
  return (
    pathname === "/onboarding" ||
    pathname === "/connect-status" ||
    pathname === "/restore-access" ||
    pathname === "/servers" ||
    pathname === "/referral" ||
    pathname.startsWith("/plan/checkout/") ||
    pathname === "/devices/issue"
  );
}
