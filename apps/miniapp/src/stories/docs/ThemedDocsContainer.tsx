import type { ReactNode } from "react";
import { useEffect } from "react";
import { DocsContainer } from "@storybook/addon-docs/blocks";
import { docsTheme, docsThemeLight } from "./storybookTheme";

type StorybookDocsThemeKey = "light" | "dark";
type StorybookThemeMode = "light" | "dark" | "system";

interface StorybookDocsGlobals {
  theme?: string;
}

interface StorybookDocsContext {
  [key: string]: unknown;
  globals?: StorybookDocsGlobals;
}

interface ThemedDocsContainerProps {
  children: ReactNode;
  context: StorybookDocsContext;
}

interface RootThemeSnapshot {
  colorScheme: string;
  dataTheme: string | null;
  hasDarkClass: boolean;
  hasLightClass: boolean;
}

function prefersLightTheme() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: light)")?.matches === true
  );
}

function resolveThemeMode(input: unknown): StorybookThemeMode {
  if (input === "light" || input === "dark" || input === "system") return input;
  return "system";
}

function resolveRootTheme(themeMode: StorybookThemeMode): StorybookDocsThemeKey {
  if (themeMode === "light") return "light";
  if (themeMode === "dark") return "dark";
  return prefersLightTheme() ? "light" : "dark";
}

function resolveDocsThemeKey(globals: StorybookDocsGlobals | undefined): StorybookDocsThemeKey {
  return resolveRootTheme(resolveThemeMode(globals?.theme));
}

function captureRootThemeSnapshot(rootElement: HTMLElement): RootThemeSnapshot {
  return {
    colorScheme: rootElement.style.colorScheme,
    dataTheme: rootElement.getAttribute("data-theme"),
    hasDarkClass: rootElement.classList.contains("consumer-dark"),
    hasLightClass: rootElement.classList.contains("consumer-light"),
  };
}

function applyRootDocsTheme(rootElement: HTMLElement, themeKey: StorybookDocsThemeKey) {
  const dataTheme = themeKey === "light" ? "consumer-light" : "consumer-dark";

  rootElement.classList.toggle("consumer-light", themeKey === "light");
  rootElement.classList.toggle("consumer-dark", themeKey === "dark");
  rootElement.setAttribute("data-theme", dataTheme);
  rootElement.style.colorScheme = themeKey;
}

function restoreRootTheme(rootElement: HTMLElement, snapshot: RootThemeSnapshot) {
  if (snapshot.dataTheme == null) {
    rootElement.removeAttribute("data-theme");
  } else {
    rootElement.setAttribute("data-theme", snapshot.dataTheme);
  }

  rootElement.classList.toggle("consumer-light", snapshot.hasLightClass);
  rootElement.classList.toggle("consumer-dark", snapshot.hasDarkClass);
  rootElement.style.colorScheme = snapshot.colorScheme;
}

export function ThemedDocsContainer({
  children,
  context,
}: ThemedDocsContainerProps) {
  const docsThemeKey = resolveDocsThemeKey(context.globals);
  const docsThemeDefinition = docsThemeKey === "light" ? docsThemeLight : docsTheme;

  useEffect(() => {
    const rootElement = document.documentElement;
    const previousThemeSnapshot = captureRootThemeSnapshot(rootElement);

    applyRootDocsTheme(rootElement, docsThemeKey);

    return () => {
      restoreRootTheme(rootElement, previousThemeSnapshot);
    };
  }, [docsThemeKey]);

  return (
    <DocsContainer context={context as never} theme={docsThemeDefinition}>
      <div className="docs-pres-docs-frame docs-pres-mdx-root">{children}</div>
    </DocsContainer>
  );
}
