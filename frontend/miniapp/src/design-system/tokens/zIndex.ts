/**
 * Design system z-index tokens. Use semantic tokens; do not hardcode z-index in components.
 * CSS source: miniapp.css, design-system/theme/z-index.ts.
 */
export const Z_INDEX_TOKENS = {
  dropdown: "--z-dropdown",
  overlay: "--z-overlay",
  modal: "--z-modal",
  toast: "--z-toast",
  /** Miniapp shell */
  header: "--z-header",
  nav: "--z-nav",
} as const;
