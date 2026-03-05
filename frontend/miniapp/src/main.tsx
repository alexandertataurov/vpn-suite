import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/lib/theme";
import App from "./App";
import { initWebVitals } from "./telemetry/webVitals";
import { wireGlobalErrors } from "./telemetry/errors";
import { initSentry } from "./telemetry/sentry";
import "./styles/miniapp-global.css";
import "./miniapp.css";

initWebVitals();
wireGlobalErrors();
initSentry();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
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
