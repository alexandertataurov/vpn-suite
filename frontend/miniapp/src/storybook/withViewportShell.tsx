import { useMemo, type ReactNode } from "react";
import type { Decorator } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { StackFlowLayout } from "@/app/ViewportLayout";

export type ViewportShellVariant = "stack";

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
  void variant; // reserved for future layout switching
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route element={<StackFlowLayout />}>{children}</Route>
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
