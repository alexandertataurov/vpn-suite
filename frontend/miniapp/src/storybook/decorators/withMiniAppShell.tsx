import { useEffect } from "react";
import type { Decorator } from "@storybook/react";
import { ThemeProvider, useTheme, type Theme } from "@/design-system/theme";
import { StorybookMiniappShell } from "../StorybookMiniappShell";

const storybookThemes = ["consumer-dark", "consumer-light"] as const satisfies readonly Theme[];

function isPageStory(title: string | undefined) {
  return title?.startsWith("Pages/") === true || title?.startsWith("States/") === true;
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

export const withMiniAppShell: Decorator = (Story, context) => (
  <ThemeProvider
    themes={storybookThemes}
    defaultTheme={(context.globals.theme as Theme | undefined) ?? "consumer-dark"}
    storageKey="vpn-suite-miniapp-storybook-theme"
  >
    <StorybookMiniappShell
      isPageStory={isPageStory(context.title)}
      viewportWidth={Number(context.globals.viewportWidth ?? 390)}
      isDesktop={String(context.globals.tgPlatform ?? "ios") === "other"}
    >
      <StorybookThemeSync theme={(context.globals.theme as Theme | undefined) ?? "consumer-dark"} />
      <Story />
    </StorybookMiniappShell>
  </ThemeProvider>
);
