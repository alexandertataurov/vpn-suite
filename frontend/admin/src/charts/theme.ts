type CssVar = `--${string}`;

function getThemeScopeElement(): HTMLElement {
  if (typeof document === "undefined") {
    // SSR/tests: no DOM available.
    return null as unknown as HTMLElement;
  }
  return (
    document.querySelector<HTMLElement>("[data-app-shell][data-console='operator']") ??
    document.querySelector<HTMLElement>("[data-console='operator']") ??
    document.documentElement
  );
}

function resolveCssVarRaw(varName: CssVar, scope: HTMLElement): string | null {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  return getComputedStyle(scope).getPropertyValue(varName).trim() || null;
}

function resolveCssNumber(varName: CssVar, fallback: number, scope: HTMLElement): number {
  const raw = resolveCssVarRaw(varName, scope);
  if (!raw) return fallback;
  // Common cases: "11px", "11", " 11px ".
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

// Resolve a CSS var into a computed `rgb(...)` string so canvas rendering is reliable even
// when the design tokens use `oklch(...)` / modern color spaces.
function resolveCssColor(varName: CssVar, fallback: string, scope: HTMLElement): string {
  if (typeof window === "undefined" || typeof document === "undefined") return fallback;
  const raw = resolveCssVarRaw(varName, scope);
  if (!raw) return fallback;

  const el = document.createElement("span");
  el.style.color = raw;
  // Keep it offscreen; still needs to be in DOM for computedStyle to resolve.
  el.style.position = "absolute";
  el.style.left = "-99999px";
  el.style.top = "-99999px";
  scope.appendChild(el);
  const color = getComputedStyle(el).color;
  el.remove();
  return color || fallback;
}

function resolveCssFont(varName: CssVar, fallback: string, scope: HTMLElement): string {
  const raw = resolveCssVarRaw(varName, scope);
  return raw || fallback;
}

export type ChartTheme = {
  fontFamily: string;
  monoFamily: string;
  axisFontSize: number;
  text: string;
  muted: string;
  faint: string;
  grid: string;
  border: string;
  surface: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipShadow: string;
  primary: { solid: string; area: string };
  series: {
    main: string;
    muted: string;
    faint: string;
    good: string;
    warn: string;
    bad: string;
    alt1: string;
    alt2: string;
    alt3: string;
  };
};

let cached: ChartTheme | null = null;
let cachedKey: string | null = null;

function getChartThemeCacheKey(scope: HTMLElement): string {
  if (typeof document === "undefined") return "ssr";
  const root = document.documentElement;
  const rootTheme = root.getAttribute("data-theme") ?? "";
  const colorScheme = root.style.colorScheme || "";
  const scopeKey = scope.hasAttribute("data-console") ? scope.getAttribute("data-console") ?? "scope" : "root";
  return `${rootTheme}|${colorScheme}|${scopeKey}`;
}

export function getChartTheme(): ChartTheme {
  const scope = getThemeScopeElement();
  const cacheKey = getChartThemeCacheKey(scope);
  if (cached && cachedKey === cacheKey) return cached;

  // Prefer explicit chart tokens when available; fall back to existing semantic colors.
  cached = {
    fontFamily: resolveCssFont("--font-sans", "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial", scope),
    monoFamily: resolveCssFont("--font-mono", "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", scope),
    axisFontSize: resolveCssNumber("--chart-axis-font-size", 11, scope),
    // Root cause fix: neutral-900 is dark in dark theme; use semantic text tokens for contrast.
    text: resolveCssColor("--color-text", resolveCssColor("--color-text-primary", "currentColor", scope), scope),
    muted: resolveCssColor("--color-text-muted", resolveCssColor("--color-text-secondary", "currentColor", scope), scope),
    faint: resolveCssColor("--color-text-tertiary", resolveCssColor("--color-text-muted", "currentColor", scope), scope),
    grid: resolveCssColor("--chart-grid", resolveCssColor("--color-border-subtle", "transparent", scope), scope),
    border: resolveCssColor("--color-border", resolveCssColor("--color-border-default", "transparent", scope), scope),
    surface: resolveCssColor("--color-background-primary", resolveCssColor("--color-void", "transparent", scope), scope),
    tooltipBg: resolveCssColor("--chart-tooltip-bg", resolveCssColor("--color-background-primary", "transparent", scope), scope),
    tooltipBorder: resolveCssColor("--chart-tooltip-border", resolveCssColor("--color-border-subtle", "transparent", scope), scope),
    tooltipShadow: resolveCssVarRaw("--shadow-tooltip", scope) || resolveCssVarRaw("--shadow-elevated", scope) || "none",
    primary: {
      solid: resolveCssColor("--color-interactive-default", resolveCssColor("--color-accent", "currentColor", scope), scope),
      area: resolveCssColor("--color-primary-subtle", resolveCssColor("--color-accent-dim", "transparent", scope), scope),
    },
    series: {
      main: resolveCssColor("--chart-series-1", resolveCssColor("--color-text", "currentColor", scope), scope),
      muted: resolveCssColor("--chart-series-2", resolveCssColor("--color-text-muted", "currentColor", scope), scope),
      faint: resolveCssColor("--chart-series-3", resolveCssColor("--color-text-tertiary", "currentColor", scope), scope),
      good: resolveCssColor("--color-success", resolveCssColor("--color-nominal-bright", "currentColor", scope), scope),
      warn: resolveCssColor("--color-warning", resolveCssColor("--color-warning-bright", "currentColor", scope), scope),
      bad: resolveCssColor("--color-error", resolveCssColor("--color-critical-bright", "currentColor", scope), scope),
      alt1: resolveCssColor("--chart-series-2", resolveCssColor("--color-text-muted", "currentColor", scope), scope),
      alt2: resolveCssColor("--chart-series-3", resolveCssColor("--color-text-tertiary", "currentColor", scope), scope),
      alt3: resolveCssColor("--chart-series-4", resolveCssColor("--color-border", "currentColor", scope), scope),
    },
  };
  cachedKey = cacheKey;

  return cached;
}

export function resetChartThemeCache() {
  cached = null;
  cachedKey = null;
}
