import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/design-system";

/* Set bypass: ?animations=force in URL, or always in dev so animations are visible during development */
if (typeof window !== "undefined") {
  const forceFromUrl = new URLSearchParams(window.location.search).get("animations") === "force";
  const forceInDev = import.meta.env.DEV;
  if (forceFromUrl || forceInDev) {
    document.documentElement.setAttribute("data-animations", "force");
    console.log(
      "[anim] bypass set",
      document.documentElement.getAttribute("data-animations"),
      "reduced-motion:",
      matchMedia("(prefers-reduced-motion: reduce)").matches,
      "reason:",
      forceFromUrl ? "url" : "dev"
    );
  }
}
import { ApiError } from "@vpn-suite/shared";
import { webappQueryKeys } from "@/lib";
import { wireGlobalErrors } from "@/telemetry/errors";
import App from "./App";
import "@/design-system/styles/index.css";
import "@/styles/app/index.css";

/**
 * Layer 0: Telemetry bootstrap. main.tsx owns analytics (PostHog, Faro, Sentry),
 * global error capture, and web vitals. Runs before React mount.
 */
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

function bootstrapTelemetry(): void {
  if (typeof window === "undefined") return;

  const run = () => {
    wireGlobalErrors();
    void import("./bootstrap/analytics").then(({ initAnalytics }) => {
      initAnalytics();
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

  run();
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

if (typeof window !== "undefined") {
  window.addEventListener("webapp:unauthorized", () => {
    void queryClient.invalidateQueries({ queryKey: [...webappQueryKeys.all] });
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        themes={["consumer-dark", "consumer-light"]}
        defaultTheme="consumer-light"
        storageKey="vpn-suite-miniapp-theme"
      >
        <BrowserRouter basename="/webapp">
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
