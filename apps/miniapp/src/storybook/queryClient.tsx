import { useMemo, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function createStorybookQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function StorybookQueryClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => createStorybookQueryClient(), []);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
