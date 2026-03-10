import type { Preview } from "@storybook/react";
import React from "react";
import { ThemeProvider } from "../src/design-system/theme";
import "../src/design-system/styles/index.css";

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider
        themes={["consumer-dark", "consumer-light"]}
        defaultTheme="consumer-dark"
        storageKey="vpn-suite-miniapp-storybook-theme"
      >
        <Story />
      </ThemeProvider>
    ),
  ],
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
};

export default preview;
