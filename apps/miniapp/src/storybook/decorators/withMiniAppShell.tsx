import { useEffect } from "react";
import type { Decorator } from "@storybook/react";
import { ThemeProvider, useTheme, type Theme } from "@/design-system/foundations";
import { StorybookMiniappShell } from "../StorybookMiniappShell";
import {
  getStoryRootDataAttributes,
  isFoundationsStory,
  resolveAnimationsMode,
  resolveConsumerTheme,
  resolveDensityMode,
  resolveThemeMode,
  resolveTokenMode,
  resolveViewportSelection,
  type AnimationsMode,
  type StorybookThemeMode,
  type TokenMode,
} from "../globals";

const storybookThemes = ["consumer-dark", "consumer-light"] as const satisfies readonly Theme[];

function isPageStory(title: string | undefined) {
  return title?.startsWith("Pages/") === true || title?.startsWith("States/") === true;
}

function StorybookThemeSync({
  themeMode,
  animationsMode,
}: {
  themeMode: StorybookThemeMode;
  animationsMode: AnimationsMode;
}) {
  const { setTheme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    const resolvedTheme = resolveConsumerTheme(themeMode);
    const previous = {
      tg: root.getAttribute("data-tg"),
      animations: root.getAttribute("data-animations"),
      reducedMotion: root.getAttribute("data-reduced-motion"),
    };

    setTheme(resolvedTheme);
    root.setAttribute("data-tg", "true");
    if (animationsMode === "always-on") {
      root.setAttribute("data-animations", "force");
    } else {
      root.removeAttribute("data-animations");
    }
    if (animationsMode === "reduced") {
      root.setAttribute("data-reduced-motion", "true");
    } else {
      root.removeAttribute("data-reduced-motion");
    }

    return () => {
      if (previous.tg == null) root.removeAttribute("data-tg");
      else root.setAttribute("data-tg", previous.tg);

      if (previous.animations == null) root.removeAttribute("data-animations");
      else root.setAttribute("data-animations", previous.animations);

      if (previous.reducedMotion == null) root.removeAttribute("data-reduced-motion");
      else root.setAttribute("data-reduced-motion", previous.reducedMotion);
    };
  }, [animationsMode, setTheme, themeMode]);

  return null;
}

function StorybookFoundationsSync({
  tokenMode,
}: {
  tokenMode: TokenMode;
}) {
  useEffect(() => {
    const root = document.documentElement;
    const previous = {
      tokenMode: root.getAttribute("data-token-mode"),
    };

    root.setAttribute("data-token-mode", tokenMode);

    return () => {
      if (previous.tokenMode == null) root.removeAttribute("data-token-mode");
      else root.setAttribute("data-token-mode", previous.tokenMode);
    };
  }, [tokenMode]);

  return null;
}

export const withMiniAppShell: Decorator = (Story, context) => {
  const themeMode = resolveThemeMode(context.globals.theme);
  const density = resolveDensityMode(context.globals.density);
  const tokenMode = resolveTokenMode(context.globals.tokenMode);
  const animationsMode = resolveAnimationsMode(context.globals.animations);
  const viewport = resolveViewportSelection(context);
  const foundationsStory = isFoundationsStory(context.title);

  return (
    <ThemeProvider
      themes={storybookThemes}
      defaultTheme={resolveConsumerTheme(themeMode)}
      storageKey="vpn-suite-miniapp-storybook-theme"
    >
      <StorybookMiniappShell
        isPageStory={isPageStory(context.title)}
        viewportWidth={viewport.width}
        isDesktop={viewport.isDesktop}
        density={density}
      >
        <StorybookThemeSync themeMode={themeMode} animationsMode={animationsMode} />
        <StorybookFoundationsSync tokenMode={tokenMode} />
        <div
          {...getStoryRootDataAttributes(context, {
            includeDensity: foundationsStory,
            includeReducedMotion: animationsMode === "reduced",
            includeTokenMode: foundationsStory,
          })}
        >
          <Story />
        </div>
      </StorybookMiniappShell>
    </ThemeProvider>
  );
};
