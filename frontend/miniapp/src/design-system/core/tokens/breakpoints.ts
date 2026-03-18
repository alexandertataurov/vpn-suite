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

/** Min-width values (px) for JS (e.g. useBreakpoint). */
export const BREAKPOINT_PX = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export const BREAKPOINT_VALUES = {
  [BREAKPOINT_TOKENS.bpSm]: `${BREAKPOINT_PX.sm}px`,
  [BREAKPOINT_TOKENS.bpMd]: `${BREAKPOINT_PX.md}px`,
  [BREAKPOINT_TOKENS.bpLg]: `${BREAKPOINT_PX.lg}px`,
  [BREAKPOINT_TOKENS.bpXl]: `${BREAKPOINT_PX.xl}px`,
} as const;
