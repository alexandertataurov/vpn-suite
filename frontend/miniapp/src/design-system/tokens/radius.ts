/**
 * Design system radius tokens. Use semantic tokens; do not hardcode border-radius in components.
 * CSS source: miniapp-tokens.css, miniapp-primitives-aliases.css, telegram-miniapp-design-system.css.
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
  /** Legacy (miniapp) */
  r: "--r",
  rSm: "--r-sm",
  rMd: "--r-md",
  rLg: "--r-lg",
  /** Telegram DS */
  dsRadiusMd: "--ds-radius-md",
} as const;
