/**
 * Design system radius tokens. Use semantic tokens; do not hardcode border-radius in components.
 * CSS source: styles/tokens/base.css, styles/theme/telegram.css.
 */
export const RADIUS_TOKENS = {
  none: "--radius-none",
  sm: "--radius-sm",
  md: "--radius-md",
  lg: "--radius-lg",
  xl: "--radius-xl",
  "2xl": "--radius-2xl",
  full: "--radius-full",
  control: "--radius-control",
  surface: "--radius-surface",
  button: "--radius-button",
} as const;
