import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@vpn-suite/shared/theme";
import { getBaseUrl } from "@vpn-suite/shared/api-client";
import { TelemetryProvider } from "./context/TelemetryContext";
import { init as initTelemetry } from "./telemetry";
import { wireGlobalErrors } from "./telemetry/errors";
import App from "./App";
import { LiveMetricsProvider } from "./context/LiveMetricsProvider";
import { useAuthStore } from "./store/authStore";
import "@vpn-suite/shared/global.css";
import "./tailwind.css";
import "./admin.css";

initTelemetry({
  baseUrl: getBaseUrl,
  getToken: () => useAuthStore.getState().getAccessToken(),
  sendFrontendErrors: true,
});
wireGlobalErrors();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30000 },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename="/admin">
      <QueryClientProvider client={queryClient}>
        <TelemetryProvider>
          <ThemeProvider themes={["dark", "dim", "light"]} defaultTheme="dark" storageKey="vpn-suite-admin-theme">
            <LiveMetricsProvider>
              <App />
            </LiveMetricsProvider>
          </ThemeProvider>
        </TelemetryProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
