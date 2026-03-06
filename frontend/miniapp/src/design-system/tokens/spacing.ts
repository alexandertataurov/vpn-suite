/**
 * Design system spacing tokens. Use semantic tokens; do not hardcode px in components.
 * CSS source: miniapp-tokens.css, telegram-miniapp-design-system.css (--ds-space-*).
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
  /** Legacy aliases (miniapp) */
  sp1: "--sp-1",
  sp2: "--sp-2",
  sp3: "--sp-3",
  sp4: "--sp-4",
  sp5: "--sp-5",
  sp6: "--sp-6",
  sp8: "--sp-8",
  /** Telegram DS 8px grid */
  dsSpace1: "--ds-space-1",
  dsSpace2: "--ds-space-2",
  dsSpace3: "--ds-space-3",
  dsSpace4: "--ds-space-4",
  dsSpace5: "--ds-space-5",
  dsSpace6: "--ds-space-6",
} as const;

/** Min spacing for touch targets (Telegram Mini-App). */
export const TOUCH_TARGET_MIN = 48;
