/**
 * Priority ladder and suppression durations (UPSELL-ENGINE-SPEC §10, §13).
 */

import type { UpgradeIntent } from "./upsell.types";

/** Level 1 = hard-block resolver; Level 5 = recovery. */
export const TRIGGER_PRIORITY: Record<UpgradeIntent, number> = {
  device_limit: 100,
  expiry: 90,
  trial_end: 85,
  annual_savings: 60,
  family: 55,
  premium_regions: 54,
  speed: 53,
  addon: 52,
  referral: 40,
  winback: 30,
};

/** Cooldown after dismiss (ms). */
export const SUPPRESSION_MS: Partial<Record<UpgradeIntent, number>> = {
  device_limit: 24 * 60 * 60 * 1000,
  annual_savings: 7 * 24 * 60 * 60 * 1000,
  referral: 7 * 24 * 60 * 60 * 1000,
};
