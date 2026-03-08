/**
 * Breakpoint tokens for miniapp viewport. Use via CSS var() or useBreakpoint().
 * CSS source: miniapp-tokens.css (--bp-sm, --bp-md).
 */
export const BREAKPOINT_TOKENS = {
  bpSm: "--bp-sm",
  bpMd: "--bp-md",
} as const;

/** Min-width values (px) for JS (e.g. useBreakpoint). */
export const BREAKPOINT_PX = {
  sm: 360,
  md: 600,
} as const;
