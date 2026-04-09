import { useEffect } from "react";
import type { Decorator } from "@storybook/react";
import { ThemeProvider, useTheme, type Theme } from "@/design-system/core/theme";
import { StorybookMiniappShell } from "../StorybookMiniappShell";

const storybookThemes = ["consumer-dark", "consumer-light"] as const satisfies readonly Theme[];

type TokenMode = "semantic" | "primitives";
type ContrastMode = "normal" | "high";
type DensityMode = "comfortable" | "compact";

function isPageStory(title: string | undefined) {
  return title?.startsWith("Pages/") === true || title?.startsWith("States/") === true;
}

function StorybookThemeSync({ theme, forceAnimations }: { theme: Theme; forceAnimations: boolean }) {
  const { setTheme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    const previous = {
      tg: root.getAttribute("data-tg"),
      animations: root.getAttribute("data-animations"),
    };

    setTheme(theme);
    root.setAttribute("data-tg", "true");
    if (forceAnimations) {
      root.setAttribute("data-animations", "force");
    } else {
      root.removeAttribute("data-animations");
    }

    return () => {
      if (previous.tg == null) root.removeAttribute("data-tg");
      else root.setAttribute("data-tg", previous.tg);

      if (previous.animations == null) root.removeAttribute("data-animations");
      else root.setAttribute("data-animations", previous.animations);
    };
  }, [setTheme, theme, forceAnimations]);

  return null;
}

function StorybookFoundationsSync({
  tokenMode,
  contrastMode,
  density,
}: {
  tokenMode: TokenMode;
  contrastMode: ContrastMode;
  density: DensityMode;
}) {
  useEffect(() => {
    const root = document.documentElement;
    const previous = {
      tokenMode: root.getAttribute("data-token-mode"),
      contrast: root.getAttribute("data-contrast"),
      density: root.getAttribute("data-density"),
    };

    root.setAttribute("data-token-mode", tokenMode);
    root.setAttribute("data-contrast", contrastMode);
    root.setAttribute("data-density", density);

    return () => {
      if (previous.tokenMode == null) root.removeAttribute("data-token-mode");
      else root.setAttribute("data-token-mode", previous.tokenMode);

      if (previous.contrast == null) root.removeAttribute("data-contrast");
      else root.setAttribute("data-contrast", previous.contrast);

      if (previous.density == null) root.removeAttribute("data-density");
      else root.setAttribute("data-density", previous.density);
    };
  }, [tokenMode, contrastMode, density]);

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
      density={(context.globals.density as DensityMode | undefined) ?? "comfortable"}
    >
      <StorybookThemeSync
        theme={(context.globals.theme as Theme | undefined) ?? "consumer-dark"}
        forceAnimations={context.globals.forceAnimations === "true"}
      />
      <StorybookFoundationsSync
        tokenMode={(context.globals.tokenMode as TokenMode | undefined) ?? "semantic"}
        contrastMode={(context.globals.contrastMode as ContrastMode | undefined) ?? "normal"}
        density={(context.globals.density as DensityMode | undefined) ?? "comfortable"}
      />
      <Story />
    </StorybookMiniappShell>
  </ThemeProvider>
);
