// Why: keep onboarding FSM/storage in sync from a single source of truth.
export const ONBOARDING_MIN_STEP = 0;
export const ONBOARDING_MAX_STEP = 2;
export const ONBOARDING_VERSION = 1;

/** Routes onboarding users may visit; they are not forced back to /onboarding on these. */
export const ONBOARDING_ALLOWED_PATHS: readonly string[] = [
  "/plan",
  "/devices",
  "/devices/issue",
];
