import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@vpn-suite/shared/theme";
import App from "./App";
import "@vpn-suite/shared/global.css";
import "./miniapp.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        themes={["consumer-light", "consumer-dark"]}
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
