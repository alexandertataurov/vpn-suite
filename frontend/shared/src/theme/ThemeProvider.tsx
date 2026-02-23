import { createContext, useContext, useState, useMemo, useEffect, type ReactNode } from "react";

export type Theme = "dark" | "light" | "dim";

const STORAGE_KEY = "vpn-suite-theme";
const VALID_THEMES: Theme[] = ["dark", "light", "dim"];

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
} | null>(null);

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored && VALID_THEMES.includes(stored)) return stored;
  const fromHtml = document.documentElement.getAttribute("data-theme") as Theme | null;
  if (fromHtml && VALID_THEMES.includes(fromHtml)) return fromHtml;
  return "dark";
}

function applyThemeToDocument(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme === "light" ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  const setThemePersisted = useMemo(() => {
    return (t: Theme) => {
      setTheme(t);
      try {
        localStorage.setItem(STORAGE_KEY, t);
      } catch {
        /* ignore */
      }
    };
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme: setThemePersisted }),
    [theme, setThemePersisted]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
