type CssVar = `--${string}`;

function resolveCssVarRaw(varName: CssVar): string | null {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || null;
}

function resolveCssNumber(varName: CssVar, fallback: number): number {
  const raw = resolveCssVarRaw(varName);
  if (!raw) return fallback;
  // Common cases: "11px", "11", " 11px ".
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

// Resolve a CSS var into a computed `rgb(...)` string so canvas rendering is reliable even
// when the design tokens use `oklch(...)` / modern color spaces.
function resolveCssColor(varName: CssVar, fallback: string): string {
  if (typeof window === "undefined" || typeof document === "undefined") return fallback;
  const raw = resolveCssVarRaw(varName);
  if (!raw) return fallback;

  const el = document.createElement("span");
  el.style.color = raw;
  // Keep it offscreen; still needs to be in DOM for computedStyle to resolve.
  el.style.position = "absolute";
  el.style.left = "-99999px";
  el.style.top = "-99999px";
  document.body.appendChild(el);
  const color = getComputedStyle(el).color;
  el.remove();
  return color || fallback;
}

function resolveCssFont(varName: CssVar, fallback: string): string {
  const raw = resolveCssVarRaw(varName);
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

export function getChartTheme(): ChartTheme {
  if (cached) return cached;

  // Prefer explicit chart tokens when available; fall back to existing semantic colors.
  cached = {
    fontFamily: resolveCssFont("--font-sans", "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial"),
    monoFamily: resolveCssFont("--font-mono", "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"),
    axisFontSize: resolveCssNumber("--chart-axis-font-size", 11),
    // Root cause fix: neutral-900 is dark in dark theme; use semantic text tokens for contrast.
    text: resolveCssColor("--color-text", "#ffffff"),
    muted: resolveCssColor("--color-text-muted", "#d4d4d4"),
    faint: resolveCssColor("--color-text-tertiary", "#a3a3a3"),
    grid: resolveCssColor("--chart-grid", resolveCssColor("--color-neutral-100", "#f5f5f5")),
    border: resolveCssColor("--color-neutral-200", "#e5e5e5"),
    surface: resolveCssColor("--color-background-primary", "#ffffff"),
    tooltipBg: resolveCssColor("--chart-tooltip-bg", resolveCssColor("--color-background-primary", "#ffffff")),
    tooltipBorder: resolveCssColor("--chart-tooltip-border", resolveCssColor("--color-neutral-200", "#e5e5e5")),
    primary: {
      solid: resolveCssColor("--color-interactive-default", "#0ea5e9"),
      area: resolveCssColor("--color-primary-subtle", "rgba(14, 165, 233, 0.15)"),
    },
    series: {
      main: resolveCssColor("--chart-series-1", resolveCssColor("--color-text", "#ffffff")),
      muted: resolveCssColor("--chart-series-2", resolveCssColor("--color-neutral-600", "#525252")),
      faint: resolveCssColor("--chart-series-3", resolveCssColor("--color-neutral-400", "#a3a3a3")),
      good: resolveCssColor("--color-success", "#16a34a"),
      warn: resolveCssColor("--color-warning", "#f59e0b"),
      bad: resolveCssColor("--color-error", "#ef4444"),
      alt1: resolveCssColor("--chart-series-2", resolveCssColor("--color-neutral-600", "#525252")),
      alt2: resolveCssColor("--chart-series-3", resolveCssColor("--color-neutral-400", "#a3a3a3")),
      alt3: resolveCssColor("--chart-series-4", resolveCssColor("--color-neutral-300", "#d4d4d4")),
    },
  };

  return cached;
}

export function resetChartThemeCache() {
  cached = null;
}
