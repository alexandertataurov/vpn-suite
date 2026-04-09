import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createApiClient } from "@/core/api/client";
import { ApiProvider } from "@/core/api/context";
import { getBaseUrl } from "@/shared/constants";
import { useAuthStore } from "@/core/auth/store";
import { TelemetryProvider } from "@/core/telemetry/provider";
import { ToastProvider } from "@/design-system/primitives";
import { App } from "./App";
import "./tailwind.css";
import "./design-system/design-system.css";
import "./layout/shell.css";
import "./app/pages.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

const apiClient = createApiClient({
  baseUrl: getBaseUrl,
  getToken: () => useAuthStore.getState().getAccessToken(),
  onUnauthorized: () => useAuthStore.getState().logout(),
  timeoutMs: 30_000,
});

void import("./core/analytics/bootstrap").then(({ initAnalytics }) => {
  initAnalytics(apiClient);
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename="/admin">
      <QueryClientProvider client={queryClient}>
        <ApiProvider client={apiClient}>
          <TelemetryProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </TelemetryProvider>
        </ApiProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
