import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/design-system/theme/ThemeProvider";
import { ApiError } from "@/lib/types/api-error";
import App from "./App";
import "@/design-system/styles/index.css";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

function bootstrapTelemetry(): void {
  if (typeof window === "undefined") return;
  const host = window as Window & {
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
  };

  const run = () => {
    void import("./telemetry/errors").then(({ wireGlobalErrors }) => {
      wireGlobalErrors();
    });
    void import("./telemetry/webVitals").then(({ initWebVitals }) => {
      initWebVitals();
    });
    if (SENTRY_DSN) {
      void import("./telemetry/sentry").then(({ initSentry }) => {
        initSentry();
      });
    }
  };

  if (typeof host.requestIdleCallback === "function") {
    host.requestIdleCallback(run, { timeout: 1_500 });
    return;
  }
  setTimeout(run, 0);
}

bootstrapTelemetry();

const QUERY_RETRY_LIMIT = 1;

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError) {
    if (error.code === "UNAUTHORIZED") return false;
    if (error.statusCode >= 400 && error.statusCode < 500) {
      // Retriable client-side edge statuses.
      const isRetriableClientStatus = error.statusCode === 408 || error.statusCode === 429;
      return isRetriableClientStatus && failureCount < QUERY_RETRY_LIMIT;
    }
  }
  return failureCount < QUERY_RETRY_LIMIT;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10_000),
      refetchOnWindowFocus: false,
      staleTime: 60_000,
      gcTime: 300_000,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        themes={["consumer-dark", "consumer-light"]}
        defaultTheme="consumer-dark"
        storageKey="vpn-suite-miniapp-theme"
      >
        <BrowserRouter basename="/webapp">
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
