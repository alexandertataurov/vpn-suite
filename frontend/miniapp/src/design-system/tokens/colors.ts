/**
 * Design system color tokens. Use semantic tokens in components; do not use primitives directly.
 * CSS source: styles/theme/consumer.css (consumer-dark/consumer-light), styles/tokens/base.css.
 * Consumer dark: #000 bg, #5caeff accent, #2ed87a success.
 * Consumer light: #fff bg, #2a82e3 accent, #1da45f success.
 *
 * Error vs danger: Semantic token is `error` (--color-error). "Danger" is legacy alias:
 * CSS --danger, .btn-danger, tokens-map SEMANTICS.danger all map to --color-error.
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
