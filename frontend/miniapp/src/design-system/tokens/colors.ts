/**
 * Design system color tokens. Use semantic tokens in components; do not use primitives directly.
 * CSS source: miniapp-tokens.css, miniapp-primitives-aliases.css.
 */
export const COLOR_TOKENS = {
  /** Page, chrome */
  bg: "--color-bg",
  /** Cards, raised surfaces */
  surface: "--color-surface",
  /** Nested surfaces */
  surface2: "--color-surface-2",
  /** Modals, dropdowns */
  overlay: "--color-overlay",
  /** Primary text */
  text: "--color-text",
  /** Secondary/muted text */
  textMuted: "--color-text-muted",
  /** Tertiary, placeholder, disabled */
  textTertiary: "--color-text-tertiary",
  /** Text on dark (inverse) */
  textInverse: "--color-text-inverse",
  /** Default border */
  border: "--color-border",
  /** Subtle border */
  borderSubtle: "--color-border-subtle",
  /** Strong border */
  borderStrong: "--color-border-strong",
  /** Primary accent / interactive */
  accent: "--color-accent",
  accentHover: "--color-accent-hover",
  accentActive: "--color-accent-active",
  /** Text on accent (e.g. button) */
  onAccent: "--color-on-accent",
  /** Focus ring */
  focusRing: "--color-focus-ring",
  /** Success / connected */
  success: "--color-success",
  /** Warning */
  warning: "--color-warning",
  /** Error / danger */
  error: "--color-error",
  /** Info */
  info: "--color-info",
} as const;

/** Aliases used by miniapp (--bg, --s0, --tx-pri, --green, etc.) — map to COLOR_TOKENS in primitives-aliases. */
export const LEGACY_ALIASES = [
  "--bg",
  "--s0",
  "--s1",
  "--s2",
  "--s3",
  "--s4",
  "--tx-pri",
  "--tx-sec",
  "--tx-mut",
  "--tx-dim",
  "--bd-sub",
  "--bd-def",
  "--bd-hi",
  "--bd-focus",
  "--green",
  "--blue",
  "--amber",
  "--red",
  "--teal",
  "--interactive",
  "--interactive-hover",
  "--success",
  "--warning",
  "--danger",
  "--focus-ring",
] as const;
