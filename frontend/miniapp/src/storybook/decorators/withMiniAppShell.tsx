import { useEffect } from "react";
import type { Decorator } from "@storybook/react";
import { ThemeProvider, useTheme, type Theme } from "@/design-system/core/theme";
import { StorybookMiniappShell } from "../StorybookMiniappShell";

const storybookThemes = ["consumer-dark", "consumer-light"] as const satisfies readonly Theme[];

function isPageStory(title: string | undefined) {
  return title?.startsWith("Pages/") === true || title?.startsWith("States/") === true;
}

function StorybookThemeSync({ theme, forceAnimations }: { theme: Theme; forceAnimations: boolean }) {
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme(theme);
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-tg", "true");
    if (forceAnimations) {
      document.documentElement.setAttribute("data-animations", "force");
    } else {
      document.documentElement.removeAttribute("data-animations");
    }
  }, [setTheme, theme, forceAnimations]);

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
      <StorybookThemeSync
        theme={(context.globals.theme as Theme | undefined) ?? "consumer-dark"}
        forceAnimations={context.globals.forceAnimations === "true"}
      />
      <Story />
    </StorybookMiniappShell>
  </ThemeProvider>
);
