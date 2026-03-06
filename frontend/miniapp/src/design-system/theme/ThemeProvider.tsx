import { createContext, useContext, useState, useMemo, useEffect, type ReactNode } from "react";

export type Theme =
  | "dark"
  | "light"
  | "dim"
  | "consumer-light"
  | "consumer-dark"
  | "starlink"
  | "primitives";

const DEFAULT_STORAGE_KEY = "vpn-suite-theme";
const DEFAULT_THEMES: readonly Theme[] = ["dark", "light", "dim"];

const ThemeContext = createContext<{
  theme: Theme;
  themes: readonly Theme[];
  setTheme: (t: Theme) => void;
} | null>(null);

function isLightTheme(theme: Theme): boolean {
  return theme === "light" || theme === "consumer-light";
}

function getInitialTheme(opts: {
  themes: readonly Theme[];
  defaultTheme: Theme;
  storageKey: string;
}): Theme {
  const { themes, defaultTheme, storageKey } = opts;
  const isAllowed = (t: Theme) => themes.includes(t);

  if (typeof window === "undefined") return isAllowed(defaultTheme) ? defaultTheme : themes[0] ?? "dark";

  const stored = localStorage.getItem(storageKey) as Theme | null;
  if (stored && isAllowed(stored)) return stored;

  const fromHtml = document.documentElement.getAttribute("data-theme") as Theme | null;
  if (fromHtml && isAllowed(fromHtml)) return fromHtml;

  return isAllowed(defaultTheme) ? defaultTheme : themes[0] ?? "dark";
}

function applyThemeToDocument(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = isLightTheme(theme) ? "light" : "dark";
}

export function ThemeProvider({
  children,
  themes = DEFAULT_THEMES,
  defaultTheme = "dark",
  storageKey = DEFAULT_STORAGE_KEY,
}: {
  children: ReactNode;
  themes?: readonly Theme[];
  defaultTheme?: Theme;
  storageKey?: string;
}) {
  const resolvedThemes = useMemo(() => (themes.length ? themes : DEFAULT_THEMES), [themes]);

  const [theme, setTheme] = useState<Theme>(() =>
    getInitialTheme({
      themes: resolvedThemes,
      defaultTheme,
      storageKey,
    })
  );

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  const setThemePersisted = useMemo(() => {
    return (t: Theme) => {
      if (!resolvedThemes.includes(t)) return;
      setTheme(t);
      try {
        localStorage.setItem(storageKey, t);
      } catch {
        /* ignore */
      }
    };
  }, [resolvedThemes, storageKey]);

  const value = useMemo(
    () => ({ theme, themes: resolvedThemes, setTheme: setThemePersisted }),
    [theme, resolvedThemes, setThemePersisted]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
