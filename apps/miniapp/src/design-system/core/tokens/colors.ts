/**
 * Design system color tokens. Use semantic tokens in components; do not use primitives directly.
 * CSS source: styles/theme/consumer.css (consumer-dark/consumer-light), styles/tokens/base.css.
 * Canonical spec (light): #F7F8FB bg, #2563EB accent, #22C55E success.
 * Dark (Stripe/Linear): #0F1419 bg, #58A6FF accent, #3FB950 success.
 *
 * Error vs danger: Semantic token is `error` (--color-error). "Danger" is legacy alias.
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
