/**
 * Design system shadow tokens. Use semantic tokens; do not hardcode box-shadow in components.
 * CSS source: styles/tokens/base.css, styles/theme/telegram.css.
 */
export const SHADOW_TOKENS = {
  none: "--shadow-none",
  sm: "--shadow-sm",
  md: "--shadow-md",
  lg: "--shadow-lg",
  /** Card (Telegram DS: often none) */
  card: "--ds-shadow-card",
  /** Focus ring (box-shadow value) */
  focusRing: "--focus-ring",
} as const;
