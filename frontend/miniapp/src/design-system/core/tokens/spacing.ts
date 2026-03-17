/**
 * Design system spacing tokens. Use semantic tokens; do not hardcode px in components.
 * CSS source: styles/tokens/base.css, styles/theme/telegram.css (--ds-space-*).
 */
export const SPACING_TOKENS = {
  /** 4px */
  "1": "--spacing-1",
  /** 8px */
  "2": "--spacing-2",
  /** 12px */
  "3": "--spacing-3",
  /** 16px */
  "4": "--spacing-4",
  /** 20px */
  "5": "--spacing-5",
  /** 24px */
  "6": "--spacing-6",
  /** 32px */
  "8": "--spacing-8",
  /** 40px */
  "10": "--spacing-10",
  /** 48px */
  "12": "--spacing-12",
} as const;

/** Min spacing for touch targets (Telegram Mini-App). */
export const TOUCH_TARGET_MIN = 48;
