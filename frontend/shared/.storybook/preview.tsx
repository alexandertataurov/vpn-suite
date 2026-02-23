import type { Preview } from "@storybook/react";
import { withThemeByDataAttribute } from "@storybook/addon-themes";
import { MemoryRouter, useInRouterContext } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "../src/ui/feedback/Toast";
import { backgroundValues } from "./theme";
import "../src/global.css";
import "../../admin/src/admin.css";
import "../../miniapp/src/miniapp.css";
import "../src/storybook/storybook.css";
import "./preview.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 0, refetchOnWindowFocus: false },
  },
});

function RouterBoundary({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const hasRouter = useInRouterContext();
  if (disabled || hasRouter) return <>{children}</>;
  return <MemoryRouter>{children}</MemoryRouter>;
}

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    layout: "padded",
    backgrounds: {
      default: "surface",
      values: backgroundValues,
    },
    viewport: {
      viewports: {
        operator: {
          name: "Operator 1440",
          styles: { width: "1440px", height: "900px" },
          type: "desktop",
        },
        compact: {
          name: "Compact 390",
          styles: { width: "390px", height: "844px" },
          type: "mobile",
        },
      },
      defaultViewport: "operator",
    },
  },
  decorators: [
    withThemeByDataAttribute({
      themes: {
        dark: "dark",
        light: "light",
        dim: "dim",
      },
      defaultTheme: "dark",
      attributeName: "data-theme",
    }),
    (Story, context) => (
      <QueryClientProvider client={queryClient}>
        <RouterBoundary disabled={context.parameters?.router?.disabled}>
          <ToastContainer>
            <div className="sb-vpn-canvas">
              <Story />
            </div>
          </ToastContainer>
        </RouterBoundary>
      </QueryClientProvider>
    ),
  ],
};

export default preview;
