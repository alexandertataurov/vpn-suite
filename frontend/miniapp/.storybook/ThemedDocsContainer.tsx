import type { ReactNode } from "react";
import { useEffect } from "react";
import { DocsContainer } from "@storybook/addon-docs/blocks";
import { docsTheme, docsThemeLight } from "./theme";

type Props = { children: ReactNode; context: Record<string, unknown> };

export function ThemedDocsContainer({ children, context }: Props) {
  const globals = context.globals as { theme?: string } | undefined;
  const themeKey = globals?.theme === "consumer-light" ? "light" : "dark";
  const theme = themeKey === "light" ? docsThemeLight : docsTheme;

  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle("consumer-light", themeKey === "light");
    el.classList.toggle("consumer-dark", themeKey === "dark");
    el.setAttribute("data-theme", themeKey === "light" ? "consumer-light" : "consumer-dark");
    el.style.colorScheme = themeKey === "light" ? "light" : "dark";
  }, [themeKey]);

  return (
    <DocsContainer context={context} theme={theme}>
      {children}
    </DocsContainer>
  );
}
