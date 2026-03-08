/**
 * Motion tokens — duration and easing. Use via CSS var() in components.
 * CSS source: miniapp-tokens.css (--duration-*, --ease-*).
 */
export const MOTION_TOKENS = {
  durationFast: "--duration-fast",
  durationNormal: "--duration-normal",
  durationSlow: "--duration-slow",
  easeDefault: "--ease-default",
  easeIn: "--ease-in",
  easeOut: "--ease-out",
  easeInOut: "--ease-in-out",
} as const;

/** Duration values (ms) for JS (e.g. setTimeout). */
export const MOTION_DURATION_MS = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;
