/**
 * Breakpoint tokens for miniapp viewport. Use via CSS var() or useBreakpoint().
 * CSS source: styles/tokens/base.css (--bp-sm, --bp-md).
 */
export const BREAKPOINT_TOKENS = {
  bpSm: "--bp-sm",
  bpMd: "--bp-md",
} as const;

/** Min-width values (px) for JS (e.g. useBreakpoint). */
export const BREAKPOINT_PX = {
  sm: 390,
  md: 600,
} as const;

export const BREAKPOINT_VALUES = {
  [BREAKPOINT_TOKENS.bpSm]: `${BREAKPOINT_PX.sm}px`,
  [BREAKPOINT_TOKENS.bpMd]: `${BREAKPOINT_PX.md}px`,
} as const;
