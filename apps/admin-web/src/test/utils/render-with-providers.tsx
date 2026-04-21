import type { ReactElement, ReactNode } from "react";
import { render, type RenderResult } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { createApiClient } from "@/core/api/client";
import { ApiProvider } from "@/core/api/context";
import { ToastProvider } from "@/design-system/primitives";

export function renderWithProviders(ui: ReactElement, options?: { route?: string }): RenderResult {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const apiClient = createApiClient({
    baseUrl: () => "",
    timeoutMs: 5_000,
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[options?.route ?? "/"]}>
        <QueryClientProvider client={queryClient}>
          <ApiProvider client={apiClient}>
            <ToastProvider>{children}</ToastProvider>
          </ApiProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );
  }

  return render(ui, { wrapper: Wrapper });
}
