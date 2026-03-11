/**
 * Design system typography tokens. Use semantic tokens; do not hardcode font-size in components.
 * CSS source: styles/theme/consumer.css (consumer-dark/consumer-light), styles/shell/frame.css (fallback),
 * styles/theme/telegram.css.
 *
 * Miniapp consumer scale (consumer-light canonical):
 * - Space Grotesk for UI, IBM Plex Mono for metadata
 * - display 32px, h1 24px, h2 18px, h3 16px, h4 15px
 * - body 14px, body-sm 14px, caption 12px, meta 12px
 */
export const TYPOGRAPHY_TOKENS = {
  fontSans: "--font-sans",
  fontMono: "--font-mono",
  /** Page title (22px) */
  fontPageTitleSize: "--ds-font-page-title-size",
  /** Section title — uses typo-h2 (18px consumer) */
  fontSectionTitleSize: "--ds-font-section-title-size",
  /** Card title — uses typo-h3 (16px consumer) */
  fontCardTitleSize: "--ds-font-card-title-size",
  /** Body — uses typo-body-sm (14px consumer) */
  fontBodySize: "--ds-font-body-size",
  /** Caption (12px consumer) */
  fontCaptionSize: "--ds-font-caption-size",
  /** Label — uses typo-meta (12px consumer) */
  fontLabelSize: "--ds-font-label-size",
  /** Content-library type scale (consumer: 32,24,18,16,15,14,13,12) */
  typoDisplaySize: "--typo-display-size",
  typoH1Size: "--typo-h1-size",
  typoH2Size: "--typo-h2-size",
  typoH3Size: "--typo-h3-size",
  typoH4Size: "--typo-h4-size",
  typoBodySize: "--typo-body-size",
  typoBodySmSize: "--typo-body-sm-size",
  typoCaptionSize: "--typo-caption-size",
  typoMetaSize: "--typo-meta-size",
  fontWeightRegular: "--ds-font-weight-regular",
  fontWeightSemibold: "--ds-font-weight-semibold",
} as const;

/**
 * Canonical resolved token values by consumer theme.
 * These power parity tests and Storybook audits.
 */
export const TYPOGRAPHY_THEME_VALUES = {
  "consumer-dark": {
    [TYPOGRAPHY_TOKENS.fontSans]: '"Space Grotesk", "IBM Plex Sans", "Inter Variable", "Inter", "Segoe UI", sans-serif',
    [TYPOGRAPHY_TOKENS.fontMono]: '"IBM Plex Mono", ui-monospace, "SFMono-Regular", "Roboto Mono", monospace',
    [TYPOGRAPHY_TOKENS.fontPageTitleSize]: "22px",
    [TYPOGRAPHY_TOKENS.fontSectionTitleSize]: "18px",
    [TYPOGRAPHY_TOKENS.fontCardTitleSize]: "15px",
    [TYPOGRAPHY_TOKENS.fontBodySize]: "14px",
    [TYPOGRAPHY_TOKENS.fontCaptionSize]: "12px",
    [TYPOGRAPHY_TOKENS.fontLabelSize]: "12px",
    [TYPOGRAPHY_TOKENS.typoDisplaySize]: "28px",
    [TYPOGRAPHY_TOKENS.typoH1Size]: "22px",
    [TYPOGRAPHY_TOKENS.typoH2Size]: "18px",
    [TYPOGRAPHY_TOKENS.typoH3Size]: "15px",
    [TYPOGRAPHY_TOKENS.typoH4Size]: "15px",
    [TYPOGRAPHY_TOKENS.typoBodySize]: "14px",
    [TYPOGRAPHY_TOKENS.typoBodySmSize]: "14px",
    [TYPOGRAPHY_TOKENS.typoCaptionSize]: "12px",
    [TYPOGRAPHY_TOKENS.typoMetaSize]: "12px",
    [TYPOGRAPHY_TOKENS.fontWeightRegular]: "400",
    [TYPOGRAPHY_TOKENS.fontWeightSemibold]: "600",
  },
  "consumer-light": {
    [TYPOGRAPHY_TOKENS.fontSans]: '"Space Grotesk", "IBM Plex Sans", "Inter Variable", "Inter", "Segoe UI", sans-serif',
    [TYPOGRAPHY_TOKENS.fontMono]: '"IBM Plex Mono", ui-monospace, "SFMono-Regular", "Roboto Mono", monospace',
    [TYPOGRAPHY_TOKENS.fontPageTitleSize]: "22px",
    [TYPOGRAPHY_TOKENS.fontSectionTitleSize]: "18px",
    [TYPOGRAPHY_TOKENS.fontCardTitleSize]: "16px",
    [TYPOGRAPHY_TOKENS.fontBodySize]: "14px",
    [TYPOGRAPHY_TOKENS.fontCaptionSize]: "12px",
    [TYPOGRAPHY_TOKENS.fontLabelSize]: "12px",
    [TYPOGRAPHY_TOKENS.typoDisplaySize]: "32px",
    [TYPOGRAPHY_TOKENS.typoH1Size]: "24px",
    [TYPOGRAPHY_TOKENS.typoH2Size]: "18px",
    [TYPOGRAPHY_TOKENS.typoH3Size]: "16px",
    [TYPOGRAPHY_TOKENS.typoH4Size]: "15px",
    [TYPOGRAPHY_TOKENS.typoBodySize]: "14px",
    [TYPOGRAPHY_TOKENS.typoBodySmSize]: "14px",
    [TYPOGRAPHY_TOKENS.typoCaptionSize]: "12px",
    [TYPOGRAPHY_TOKENS.typoMetaSize]: "12px",
    [TYPOGRAPHY_TOKENS.fontWeightRegular]: "400",
    [TYPOGRAPHY_TOKENS.fontWeightSemibold]: "600",
  },
} as const;
