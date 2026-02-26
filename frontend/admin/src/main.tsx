import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@vpn-suite/shared/theme";
import App from "./App";
import "@vpn-suite/shared/global.css";
import "./tailwind.css";
import "./admin.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30000 },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename="/admin">
      <QueryClientProvider client={queryClient}>
        <ThemeProvider themes={["dark", "dim", "light"]} defaultTheme="dark" storageKey="vpn-suite-admin-theme">
          <App />
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
