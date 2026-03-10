/**
 * Design system typography tokens. Use semantic tokens; do not hardcode font-size in components.
* CSS source: styles/theme/consumer.css (consumer-dark/consumer-light), styles/shell/frame.css (fallback),
* styles/theme/telegram.css.
 *
 * Miniapp consumer scale: Space Grotesk + IBM Plex Mono; display 32, h1 24, h2 18, h3 16, body 14, caption 12, meta 12.
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
