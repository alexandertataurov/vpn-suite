import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { LayoutProvider } from "@/context/LayoutContext";
import { ToastContainer } from "@/design-system";

export function createWrapper(options?: { initialEntries?: string[] }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const initialEntries = options?.initialEntries ?? ["/"];

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          <ToastContainer>
            <LayoutProvider stackFlow={false}>{children}</LayoutProvider>
          </ToastContainer>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };
}

export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions & { initialEntries?: string[] },
): ReturnType<typeof render> {
  const { initialEntries, ...renderOptions } = options ?? {};
  const Wrapper = createWrapper({ initialEntries });
  return render(ui, {
    wrapper: Wrapper,
    ...renderOptions,
  });
}
