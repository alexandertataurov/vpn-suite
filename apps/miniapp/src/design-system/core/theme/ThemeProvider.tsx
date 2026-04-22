import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

/** Miniapp uses consumer-dark | consumer-light. primitives, starlink, dim are legacy/admin. */
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

function isThemeAllowed(theme: Theme, themes: readonly Theme[]): boolean {
  return themes.includes(theme);
}

function getPreferredSystemTheme(themes: readonly Theme[]): Theme | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return null;

  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  const preferredThemes = prefersLight
    ? (["consumer-light", "light"] as const)
    : (["consumer-dark", "dark"] as const);

  for (const theme of preferredThemes) {
    if (isThemeAllowed(theme, themes)) return theme;
  }

  return null;
}

function readStoredTheme(storageKey: string): Theme | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(storageKey) as Theme | null;
  } catch {
    return null;
  }
}

function getInitialTheme(opts: {
  themes: readonly Theme[];
  defaultTheme: Theme;
  storageKey: string;
}): Theme {
  const { themes, defaultTheme, storageKey } = opts;
  if (typeof window === "undefined") return isThemeAllowed(defaultTheme, themes) ? defaultTheme : themes[0] ?? "dark";

  const stored = readStoredTheme(storageKey);
  if (stored && isThemeAllowed(stored, themes)) return stored;

  const fromHtml = document.documentElement.getAttribute("data-theme") as Theme | null;
  if (fromHtml && isThemeAllowed(fromHtml, themes)) return fromHtml;

  const fromSystem = getPreferredSystemTheme(themes);
  if (fromSystem) return fromSystem;

  return isThemeAllowed(defaultTheme, themes) ? defaultTheme : themes[0] ?? "dark";
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

  const setThemePersisted = useCallback(
    (nextTheme: Theme) => {
      if (!resolvedThemes.includes(nextTheme)) return;
      setTheme(nextTheme);
      try {
        window.localStorage.setItem(storageKey, nextTheme);
      } catch {
        /* ignore storage failures */
      }
    },
    [resolvedThemes, storageKey],
  );

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
