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
    const previous = {
      theme: el.getAttribute("data-theme"),
      lightClass: el.classList.contains("consumer-light"),
      darkClass: el.classList.contains("consumer-dark"),
      colorScheme: el.style.colorScheme,
    };

    el.classList.toggle("consumer-light", themeKey === "light");
    el.classList.toggle("consumer-dark", themeKey === "dark");
    el.setAttribute("data-theme", themeKey === "light" ? "consumer-light" : "consumer-dark");
    el.style.colorScheme = themeKey === "light" ? "light" : "dark";

    return () => {
      if (previous.theme == null) el.removeAttribute("data-theme");
      else el.setAttribute("data-theme", previous.theme);

      el.classList.toggle("consumer-light", previous.lightClass);
      el.classList.toggle("consumer-dark", previous.darkClass);
      el.style.colorScheme = previous.colorScheme;
    };
  }, [themeKey]);

  return (
    <DocsContainer context={context} theme={theme}>
      {children}
    </DocsContainer>
  );
}
