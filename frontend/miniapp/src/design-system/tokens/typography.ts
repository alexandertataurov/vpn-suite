/**
 * Design system typography tokens. Use semantic tokens; do not hardcode font-size in components.
 * CSS source: miniapp-tokens.css, telegram-miniapp-design-system.css, miniapp-primitives-aliases.css.
 */
export const TYPOGRAPHY_TOKENS = {
  fontSans: "--font-sans",
  fontMono: "--font-mono",
  /** Page title (22px) */
  fontPageTitleSize: "--ds-font-page-title-size",
  /** Section title (18px) */
  fontSectionTitleSize: "--ds-font-section-title-size",
  /** Card title (16px) */
  fontCardTitleSize: "--ds-font-card-title-size",
  /** Body (14px) */
  fontBodySize: "--ds-font-body-size",
  /** Caption (12px) */
  fontCaptionSize: "--ds-font-caption-size",
  /** Label (12px) */
  fontLabelSize: "--ds-font-label-size",
  /** Legacy type scale (primitives-aliases) */
  text2xs: "--text-2xs",
  textXs: "--text-xs",
  textSm: "--text-sm",
  textBase: "--text-base",
  textMd: "--text-md",
  textLg: "--text-lg",
  textXl: "--text-xl",
  text2xl: "--text-2xl",
  text3xl: "--text-3xl",
  text4xl: "--text-4xl",
  textHero: "--text-hero",
  fontWeightRegular: "--ds-font-weight-regular",
  fontWeightSemibold: "--ds-font-weight-semibold",
} as const;
