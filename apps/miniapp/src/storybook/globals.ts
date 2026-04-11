import type { StoryContext } from "@storybook/react";
import type { Theme } from "@/design-system/foundations";

export type StorybookThemeMode = "light" | "dark" | "system";
export type TokenMode = "semantic" | "primitives";
export type DensityMode = "compact" | "default" | "comfortable";
export type AnimationsMode = "system" | "always-on" | "reduced";

type ViewportOption = {
  styles?: {
    width?: string;
  };
  type?: "desktop" | "mobile" | "tablet" | "watch" | "other";
};

type ViewportSelection =
  | string
  | {
      value?: string;
    };

type StorybookContextLike = Pick<StoryContext, "globals" | "parameters" | "title">;

function prefersLightTheme() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: light)")?.matches === true;
}

export function resolveThemeMode(input: unknown): StorybookThemeMode {
  if (input === "light" || input === "dark" || input === "system") return input;
  return "system";
}

export function resolveConsumerTheme(themeMode: StorybookThemeMode): Extract<Theme, "consumer-light" | "consumer-dark"> {
  if (themeMode === "light") return "consumer-light";
  if (themeMode === "dark") return "consumer-dark";
  return prefersLightTheme() ? "consumer-light" : "consumer-dark";
}

export function resolveRootTheme(themeMode: StorybookThemeMode): "light" | "dark" {
  return resolveConsumerTheme(themeMode) === "consumer-light" ? "light" : "dark";
}

export function resolveTokenMode(input: unknown): TokenMode {
  return input === "primitives" ? "primitives" : "semantic";
}

export function resolveDensityMode(input: unknown): DensityMode {
  if (input === "compact" || input === "comfortable" || input === "default") return input;
  return "default";
}

export function resolveAnimationsMode(input: unknown): AnimationsMode {
  if (input === "always-on" || input === "reduced" || input === "system") return input;
  return "system";
}

export function isFoundationsStory(title: string | undefined) {
  return title?.startsWith("Foundations/") === true;
}

export function resolveViewportSelection(context: StorybookContextLike) {
  const viewportParameters = context.parameters.viewport as
    | {
        defaultViewport?: string;
        options?: Record<string, ViewportOption>;
      }
    | undefined;
  const viewportGlobals = context.globals.viewport as ViewportSelection | undefined;
  const selectedId =
    typeof viewportGlobals === "string"
      ? viewportGlobals
      : viewportGlobals?.value ?? viewportParameters?.defaultViewport;
  const option = selectedId ? viewportParameters?.options?.[selectedId] : undefined;
  const width = Number.parseInt(option?.styles?.width ?? "", 10);
  const normalizedWidth = Number.isFinite(width) ? width : 390;
  const type =
    option?.type ?? (normalizedWidth >= 1024 ? "desktop" : normalizedWidth >= 768 ? "tablet" : "mobile");

  return {
    id: selectedId,
    option,
    width: normalizedWidth,
    type,
    isDesktop: type === "desktop",
  };
}

export function getStoryRootDataAttributes(
  context: StorybookContextLike,
  options: {
    includeDensity?: boolean;
    includeReducedMotion?: boolean;
    includeTokenMode?: boolean;
  } = {}
) {
  const themeMode = resolveThemeMode(context.globals.theme);
  const density = resolveDensityMode(context.globals.density);
  const animations = resolveAnimationsMode(context.globals.animations);
  const tokenMode = resolveTokenMode(context.globals.tokenMode);

  return {
    className: "sb-story-root",
    "data-theme": resolveRootTheme(themeMode),
    "data-density": options.includeDensity ? density : undefined,
    "data-reduced-motion": options.includeReducedMotion && animations === "reduced" ? "true" : undefined,
    "data-token-mode": options.includeTokenMode ? tokenMode : undefined,
  };
}
