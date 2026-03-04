import type { Preview } from "@storybook/react";
import React from "react";
import { ThemeProvider } from "../src/shared-inline/theme";
import "../src/styles/miniapp-global.css";
import "../src/miniapp.css";

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider
        themes={["consumer-dark"]}
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
