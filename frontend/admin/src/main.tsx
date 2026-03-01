import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@vpn-suite/shared/theme";
import { getBaseUrl } from "@vpn-suite/shared/api-client";
import { TelemetryProvider } from "./context/TelemetryContext";
import { init as initTelemetry } from "./telemetry";
import { wireGlobalErrors } from "./telemetry/errors";
import { initWebVitals } from "./telemetry/webVitals";
import { initSentry } from "./telemetry/sentry";
import App from "./App";
import { LiveMetricsProvider } from "./context/LiveMetricsProvider";
import { DensityProvider } from "./context/DensityContext";
import { useAuthStore } from "./store/authStore";
import "./tailwind.css";
import "./admin.css";

const telemetryEnv =
  typeof import.meta !== "undefined"
    ? ((import.meta as { env?: { VITE_ADMIN_TELEMETRY_EVENTS_ENABLED?: string; VITE_ADMIN_TELEMETRY_SAMPLE_RATE?: string } }).env ?? {})
    : {};
const telemetrySampleRate = Number(telemetryEnv.VITE_ADMIN_TELEMETRY_SAMPLE_RATE ?? "1");

initTelemetry({
  baseUrl: getBaseUrl,
  getToken: () => useAuthStore.getState().getAccessToken(),
  sendFrontendErrors: true,
  sendEventsBatch: telemetryEnv.VITE_ADMIN_TELEMETRY_EVENTS_ENABLED !== "0",
  sampleRate: Number.isFinite(telemetrySampleRate) ? telemetrySampleRate : 1,
});
initSentry();
wireGlobalErrors();
initWebVitals();

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
          <ThemeProvider themes={["starlink", "orbital", "dark", "dim", "light"]} defaultTheme="starlink" storageKey="vpn-suite-admin-theme">
            <DensityProvider>
            <LiveMetricsProvider>
              <App />
            </LiveMetricsProvider>
            </DensityProvider>
          </ThemeProvider>
        </TelemetryProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
