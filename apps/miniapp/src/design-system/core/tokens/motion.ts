/**
 * Motion tokens — duration, easing, and travel.
 * CSS source: styles/tokens/base.css.
 */
export const MOTION_TOKENS = {
  durationTap: "--duration-tap",
  durationMicro: "--duration-micro",
  durationEnter: "--duration-enter",
  durationExit: "--duration-exit",
  durationPanel: "--duration-panel",
  durationSheet: "--duration-sheet",
  easePress: "--ease-press",
  easeRelease: "--ease-release",
  easeEnter: "--ease-enter",
  easeExit: "--ease-exit",
  easeStandard: "--ease-standard",
  distanceXs: "--motion-distance-xs",
  distanceSm: "--motion-distance-sm",
} as const;

/** Duration values (ms) for JS timers keyed to motion semantics. */
export const MOTION_DURATION_MS = {
  tap: 96,
  micro: 140,
  enter: 180,
  exit: 140,
  panel: 220,
  sheet: 260,
} as const;

export type MotionDurationKey = keyof typeof MOTION_DURATION_MS;

export function getMotionDurationMs(kind: MotionDurationKey, reducedMotion = false): number {
  if (!reducedMotion) {
    return MOTION_DURATION_MS[kind];
  }

  switch (kind) {
    case "tap":
      return 48;
    case "micro":
      return 72;
    case "enter":
    case "exit":
      return 100;
    case "panel":
      return 120;
    case "sheet":
      return 140;
    default:
      return MOTION_DURATION_MS[kind];
  }
}
