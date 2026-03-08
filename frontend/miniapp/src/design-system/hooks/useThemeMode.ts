/**
 * Design-system hook: current theme mode (light vs dark). Wraps useTheme.
 */
import { useTheme } from "../theme";

export type ThemeMode = "light" | "dark";

const LIGHT_THEMES: readonly string[] = ["light", "consumer-light"];

export function useThemeMode(): ThemeMode {
  const { theme } = useTheme();
  return LIGHT_THEMES.includes(theme) ? "light" : "dark";
}
