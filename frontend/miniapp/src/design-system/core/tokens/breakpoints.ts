/**
 * Breakpoint tokens. Use via CSS var() or useBreakpoint().
 * CSS source: styles/tokens/_breakpoints.css
 */
export const BREAKPOINT_TOKENS = {
  bpSm: "--bp-sm",
  bpMd: "--bp-md",
  bpLg: "--bp-lg",
  bpXl: "--bp-xl",
} as const;

export const VIEWPORT_TOKENS = {
  vpMinimal: "--vp-minimal",
  vpNarrow: "--vp-narrow",
  vpMobile: "--vp-mobile",
  vpMidMobile: "--vp-mid-mobile",
  vpWideMobile: "--vp-wide-mobile",
  vpCompact: "--vp-compact",
} as const;

/** Min-width values (px) for JS (e.g. useBreakpoint). */
export const BREAKPOINT_PX = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

/** Viewport cutoff values (px) for max-width media queries. */
export const VIEWPORT_PX = {
  minimal: 320,
  narrow: 360,
  mobile: 390,
  midMobile: 420,
  wideMobile: 430,
  compact: 560,
} as const;

export const BREAKPOINT_VALUES = {
  [BREAKPOINT_TOKENS.bpSm]: `${BREAKPOINT_PX.sm}px`,
  [BREAKPOINT_TOKENS.bpMd]: `${BREAKPOINT_PX.md}px`,
  [BREAKPOINT_TOKENS.bpLg]: `${BREAKPOINT_PX.lg}px`,
  [BREAKPOINT_TOKENS.bpXl]: `${BREAKPOINT_PX.xl}px`,
} as const;
