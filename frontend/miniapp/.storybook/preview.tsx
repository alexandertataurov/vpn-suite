import type { Preview } from "@storybook/react";
import React, { useEffect } from "react";
import { ThemeProvider, useTheme, type Theme } from "../src/design-system/theme";
import { StorybookMiniappShell } from "../src/storybook/StorybookMiniappShell";
import { withTelegramEnvironment, type TelegramPlatform } from "../src/storybook/telegramEnvironment";
import "../src/design-system/styles/index.css";
import "../src/styles/app/index.css";
import "../src/storybook/preview.css";

const storybookThemes = ["consumer-dark", "consumer-light"] as const satisfies readonly Theme[];

function isPageStory(title: string | undefined) {
  return title?.startsWith("Pages/") === true;
}

function StorybookThemeSync({ theme }: { theme: Theme }) {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme(theme);
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-tg", "true");
  }, [setTheme, theme]);

  return null;
}

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Consumer theme",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: [
          { value: "consumer-dark", title: "Consumer Dark" },
          { value: "consumer-light", title: "Consumer Light" },
        ],
        dynamicTitle: true,
      },
    },
    viewportWidth: {
      description: "Page preview width",
      toolbar: {
        title: "Viewport",
        icon: "browser",
        items: [
          { value: "390", title: "sm 390" },
          { value: "430", title: "phone 430" },
          { value: "600", title: "md 600" },
          { value: "1024", title: "xl 1024" },
        ],
        dynamicTitle: true,
      },
    },
    tgPlatform: {
      description: "Telegram platform environment",
      toolbar: {
        title: "Platform",
        icon: "mobile",
        items: [
          { value: "ios", title: "iOS" },
          { value: "android", title: "Android" },
          { value: "other", title: "Desktop" },
        ],
        dynamicTitle: true,
      },
    },
    tgFullscreen: {
      description: "Telegram fullscreen environment",
      toolbar: {
        title: "Fullscreen",
        icon: "browser",
        items: [
          { value: "false", title: "Windowed" },
          { value: "true", title: "Fullscreen" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "consumer-dark",
    viewportWidth: "390",
    tgPlatform: "ios",
    tgFullscreen: "false",
  },
  decorators: [
    withTelegramEnvironment,
    (Story, context) => (
      <ThemeProvider
        themes={storybookThemes}
        defaultTheme={context.globals.theme as Theme}
        storageKey="vpn-suite-miniapp-storybook-theme"
      >
        <StorybookMiniappShell
          isPageStory={isPageStory(context.title)}
          viewportWidth={Number(context.globals.viewportWidth ?? 390)}
          isDesktop={((context.globals.tgPlatform ?? "ios") as TelegramPlatform) === "other"}
        >
          <StorybookThemeSync theme={context.globals.theme as Theme} />
          <Story />
        </StorybookMiniappShell>
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    options: {
      storySort: {
        order: ["Foundations", "Primitives", "Components", "Patterns", "Layouts", "Pages", "States", "*"],
      },
    },
  },
};

export default preview;
